import { useEffect, useMemo, useRef, useState } from "react";
import { createTryOnClient } from "./tryOnClient";
import { STATIC_DEMO, assetPath } from "./runtime.js";
import { createStaticTryOnClient } from "./staticTryOn.js";

const idle = {
  phase: "idle",
  image: null,
  transparent: true,
  error: "",
  elapsed: 0,
};

export function useTryOn(photo, selected, ready = true) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState(idle);
  const [configured, setConfigured] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const client = useRef(null);
  if (!client.current)
    client.current = STATIC_DEMO
      ? createStaticTryOnClient()
      : createTryOnClient();
  const person = photo?.image || "/images/model-alternate.jpg";
  const garments = useMemo(
    () =>
      selected.map(({ id, image, category, name }) => ({
        id,
        image,
        category,
        name,
      })),
    [selected],
  );

  useEffect(() => {
    if (STATIC_DEMO) {
      setConfigured(false);
      return;
    }
    const controller = new AbortController();
    fetch("/api/tryon/config", { signal: controller.signal })
      .then((r) => r.json())
      .then((c) => {
        if (!controller.signal.aborted) setConfigured(c.configured);
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfigured(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (STATIC_DEMO || !photo?.image || !ready) return;
    const controller = new AbortController();
    fetch("/api/tryon/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person: photo.image }),
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Foreground extraction unavailable");
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setPrepared({ ...data, person });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [person, ready]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    let clock;
    if (!garments.length) {
      setStatus(idle);
      return () => controller.abort();
    }
    setStatus((s) => ({
      ...(s.person === person ? s : idle),
      person,
      phase: "pending",
      error: "",
      elapsed: 0,
      cached: false,
    }));
    const onStatus = (job) => {
      if (controller.signal.aborted) return;
      clearInterval(clock);
      const received = Date.now();
      const update = () =>
        setStatus((s) => ({
          ...s,
          phase: job.status,
          elapsed:
            (job.elapsed || 0) + Math.floor((Date.now() - received) / 1000),
        }));
      update();
      clock = setInterval(update, 1000);
    };
    client.current
      .request(person, garments, {
        signal: controller.signal,
        generate: attempt > 0,
        onStatus,
      })
      .then((job) => {
        if (controller.signal.aborted) return;
        clearInterval(clock);
        setStatus(
          job.status === "complete"
            ? {
                phase: "complete",
                person,
                image: job.image,
                transparent: job.transparent,
                aspect: job.aspect,
                error: "",
                elapsed: job.elapsed || 0,
                cached: job.cached,
                cacheSource: job.cacheSource,
              }
            : { ...idle, person },
        );
      })
      .catch((error) => {
        clearInterval(clock);
        if (!controller.signal.aborted)
          setStatus((s) => ({
            ...s,
            phase: "error",
            error:
              error.name === "TypeError" || error.name === "TimeoutError"
                ? "连接暂时中断，请检查网络后重试。"
                : error.message,
          }));
      });
    return () => {
      clearInterval(clock);
      controller.abort();
    };
  }, [garments, person, attempt, ready]);

  // Derive identity/empty state during render, before effect cleanup can run.
  const current = selected.length && status.person === person ? status : idle;
  const foreground = prepared?.person === person ? prepared : null;
  return {
    ...current,
    staticDemo: STATIC_DEMO,
    configured,
    displayImage:
      current.image ||
      foreground?.image ||
      photo?.image ||
      assetPath("images/model.webp"),
    displayTransparent: current.image
      ? current.transparent
      : (foreground?.transparent ?? !photo),
    request: () => setAttempt((n) => n + 1),
  };
}
