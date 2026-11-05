#!/usr/bin/env python3
"""Validate catalog.json and gallery preview assets against the repository contract.

Implements the checks from the README "Catalog: source of truth" and
"Gallery preview assets" sections. Run from the repository root:

    python3 scripts/validate-catalog.py

Exit code is 0 when every check passes, 1 otherwise. Media checks use ffprobe
when available; without ffprobe only path/format-magic checks run and video
codec checks are reported as skipped.
"""

from __future__ import annotations

import json
import os
import struct
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "catalog.json")

TONES = {"forest", "sand", "night", "ink", "lilac", "sea"}
COVER_MAX_BYTES = 1 * 1024 * 1024          # 1 MiB
VIDEO_MAX_BYTES = 10 * 1024 * 1024         # 10 MiB
VIDEO_MIN_SECONDS = 5
VIDEO_MAX_SECONDS = 30

# Templates grandfathered by the README before the PNG/MP4 pair rule:
# pocket-planet keeps preview/cover.svg; space-dash / plane-war / stepfun-3d
# keep preview/hover.gif via coverHover; aurora-launch / prism-studio / atelier
# keep PNG covers without a video. New entries are NOT grandfathered.
LEGACY_WITHOUT_VIDEO = {
    "space-dash", "plane-war", "stepfun-3d", "aurora-launch",
    "prism-studio", "atelier", "pocket-planet",
}

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def is_repo_relative(value: str) -> bool:
    return (
        isinstance(value, str)
        and value != ""
        and not value.startswith("/")
        and not value.startswith("~")
        and "://" not in value
        and not value.startswith("file:")
        and ".." not in value.split("/")
    )


def check_png(path: str, label: str) -> None:
    try:
        size = os.path.getsize(path)
    except OSError as exc:
        fail(f"{label}: cannot read ({exc})")
        return
    if size > COVER_MAX_BYTES:
        warn(f"{label}: {size} bytes exceeds the recommended 1 MiB cover limit")
    with open(path, "rb") as fh:
        magic = fh.read(8)
    if magic != b"\x89PNG\r\n\x1a\n":
        fail(f"{label}: not a real PNG (bad magic bytes)")


def mp4_faststart(path: str) -> bool | None:
    """True when the moov atom precedes mdat, None when unparsable."""
    with open(path, "rb") as fh:
        offsets = {}
        while True:
            header = fh.read(8)
            if len(header) < 8:
                break
            size, kind = struct.unpack(">I4s", header)
            atom_start = fh.tell() - 8
            if kind in (b"moov", b"mdat") and kind not in offsets:
                offsets[kind] = atom_start
            if size == 1:
                size = struct.unpack(">Q", fh.read(8))[0]
                header_len = 16
            elif size == 0:
                break
            else:
                header_len = 8
            if size < header_len:
                break
            fh.seek(atom_start + size)
    if b"moov" not in offsets or b"mdat" not in offsets:
        return None
    return offsets[b"moov"] < offsets[b"mdat"]


def probe_video(path: str) -> dict | None:
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_streams", "-show_format",
             "-of", "json", path],
            capture_output=True, text=True, timeout=60,
        )
        return json.loads(out.stdout)
    except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def check_video(path: str, label: str) -> None:
    try:
        size = os.path.getsize(path)
    except OSError as exc:
        fail(f"{label}: cannot read ({exc})")
        return
    if size > VIDEO_MAX_BYTES:
        warn(f"{label}: {size} bytes exceeds the recommended 10 MiB video limit")
    fast = mp4_faststart(path)
    if fast is False:
        fail(f"{label}: moov atom is not before mdat (faststart disabled)")
    elif fast is None:
        warn(f"{label}: could not determine faststart from atom order")

    info = probe_video(path)
    if info is None:
        warn(f"{label}: ffprobe unavailable or failed; codec/audio/duration checks skipped")
        return
    streams = info.get("streams", [])
    videos = [s for s in streams if s.get("codec_type") == "video"]
    audios = [s for s in streams if s.get("codec_type") == "audio"]
    if not videos:
        fail(f"{label}: no video stream")
    elif videos[0].get("codec_name") != "h264":
        fail(f"{label}: video codec is {videos[0].get('codec_name')}, expected h264")
    if audios:
        fail(f"{label}: contains {len(audios)} audio track(s); preview video must be silent")
    try:
        duration = float(info.get("format", {}).get("duration", 0))
        if not (VIDEO_MIN_SECONDS <= duration <= VIDEO_MAX_SECONDS):
            fail(f"{label}: duration {duration:.1f}s outside {VIDEO_MIN_SECONDS}-{VIDEO_MAX_SECONDS}s")
    except (TypeError, ValueError):
        warn(f"{label}: duration could not be parsed")


def main() -> int:
    try:
        with open(CATALOG, encoding="utf-8") as fh:
            catalog = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"FATAL: cannot parse catalog.json ({exc})")
        return 1

    if catalog.get("schemaVersion") != 1:
        fail(f"schemaVersion must be 1, got {catalog.get('schemaVersion')!r}")

    scenes = catalog.get("scenes")
    templates = catalog.get("templates")
    if not isinstance(scenes, list) or not scenes:
        fail("scenes must be a non-empty array")
    if not isinstance(templates, list) or not templates:
        fail("templates must be a non-empty array")

    scene_ids: set[str] = set()
    for scene in scenes or []:
        sid = scene.get("id")
        if not sid or not isinstance(sid, str):
            fail(f"scene without a string id: {scene!r}")
            continue
        if sid in scene_ids:
            fail(f"duplicate scene id: {sid}")
        scene_ids.add(sid)
        for lang in ("zh", "en"):
            if not scene.get("title", {}).get(lang):
                fail(f"scene {sid}: missing title.{lang}")

    template_ids: set[str] = set()
    for tpl in templates or []:
        tid = tpl.get("id")
        if not tid or not isinstance(tid, str):
            fail(f"template without a string id: {tpl!r}")
            continue
        if tid in template_ids:
            fail(f"duplicate template id: {tid}")
        template_ids.add(tid)

        if tpl.get("scene") not in scene_ids:
            fail(f"template {tid}: scene {tpl.get('scene')!r} is not a listed scene")
        if tpl.get("tone") not in TONES:
            fail(f"template {tid}: tone {tpl.get('tone')!r} not in {sorted(TONES)}")
        for lang in ("zh", "en"):
            if not tpl.get("title", {}).get(lang):
                fail(f"template {tid}: missing title.{lang}")

        for field in ("dir", "cover", "coverHover", "previewVideo"):
            value = tpl.get(field)
            if value is None:
                continue
            if not is_repo_relative(value):
                fail(f"template {tid}: {field}={value!r} is not a repository-root-relative POSIX path")
                continue
            full = os.path.join(ROOT, value)
            if not os.path.exists(full):
                fail(f"template {tid}: {field} path does not exist: {value}")
                continue
            if field == "cover" and value.endswith(".png"):
                check_png(full, f"template {tid} cover")
            if field == "previewVideo":
                check_video(full, f"template {tid} previewVideo")

        tpl_dir = os.path.join(ROOT, tpl.get("dir", ""))
        if os.path.isdir(tpl_dir) and not os.path.isfile(os.path.join(tpl_dir, "index.html")):
            fail(f"template {tid}: {tpl.get('dir')} has no index.html entry point")

        url = tpl.get("previewUrl")
        if url is not None and not str(url).startswith("https://"):
            fail(f"template {tid}: previewUrl must be a public HTTPS URL, got {url!r}")

        has_cover = tpl.get("cover")
        has_video = tpl.get("previewVideo")
        if not has_cover:
            fail(f"template {tid}: missing cover")
        if not has_video and tid not in LEGACY_WITHOUT_VIDEO:
            fail(f"template {tid}: new templates must declare previewVideo (PNG/MP4 pair)")

    for warning in warnings:
        print(f"WARN: {warning}")
    if errors:
        for err in errors:
            print(f"ERROR: {err}")
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"catalog.json OK: {len(scenes)} scenes, {len(templates)} templates, "
          f"{len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
