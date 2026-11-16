import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const execute = promisify(execFile);
const imageTypes = new Map([
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);
const allowedCategories = new Set([
  "top",
  "bottom",
  "outer",
  "dress",
  "shoes",
  "bag",
]);
const categoryNames = {
  top: "top",
  bottom: "trousers or skirt",
  outer: "outer layer",
  dress: "dress",
  shoes: "footwear",
  bag: "accessory",
};
const instructionsVersion = "muse-v2-actual-fit-2";

export function decodeDataImage(value) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
    value || "",
  );
  if (!match) throw new Error("请上传有效的 JPG、PNG 或 WebP 照片。");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 12 * 1024 * 1024)
    throw new Error("图片数据过大，请缩小后重试。");
  return { bytes, type: imageTypes.get(match[1]) };
}

export function createTryOnMiddleware(root, env = process.env) {
  const cache = path.join(root, ".cache/tryon");
  const jobs = new Map();
  const preparations = new Map();
  let running = 0;
  const apiKey =
    env.TRYON_API_KEY || env.OPENAI_API_KEY || env.STEPCODE_API_KEY;
  const apiBase = (
    env.TRYON_API_BASE ||
    (env.TRYON_API_KEY || env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : env.STEPCODE_BASE_URL) ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = env.TRYON_MODEL || "gpt-image-2";
  const send = (res, code, data) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(data));
  };

  async function readImage(value) {
    if (typeof value !== "string") throw new Error("缺少图片。");
    if (value.startsWith("data:")) return decodeDataImage(value);
    if (!/^\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(value))
      throw new Error("图片必须来自已上传照片或本站衣橱。");
    const bytes = await fs.readFile(path.join(root, "public", value));
    return { bytes, type: imageTypes.get(path.extname(value).slice(1)) };
  }

  async function processJob(job) {
    running++;
    job.status = "generating";
    job.started = Date.now();
    try {
      const form = new FormData();
      form.set("model", model);
      form.set("size", "1024x1536");
      form.set("quality", "medium");
      const list = job.garments
        .map(
          (g, i) =>
            `Image ${i + 2}: exact ${categoryNames[g.category]}, ${g.name}.`,
        )
        .join("\n");
      form.set(
        "prompt",
        `Photorealistic virtual try-on. Image 1 is the person's identity and pose reference. Dress THAT SAME PERSON in ALL the supplied garments.\n${list}\nReplace the corresponding existing clothing with these exact garments. Accurately preserve the reference garment colors, shape, fabric, neckline, sleeve lengths, patterns and details. If an outer layer is supplied, layer it naturally over the selected top. Preserve the person's face, identity, hairstyle, pose, body proportions, and uncovered skin. Keep non-replaced garments as in image 1. Keep the same front-facing camera and a relaxed natural standing pose. Show the COMPLETE person head to shoes, both feet visible, with a small clear margin. Plain seamless nearly white studio background without props or text. Natural high-end fashion catalogue photography. Output only the completed image.`,
      );
      form.append(
        "image[]",
        new Blob([job.person.bytes], { type: job.person.type }),
        "person." + job.person.type.split("/")[1],
      );
      job.garments.forEach((g, i) =>
        form.append(
          "image[]",
          new Blob([g.bytes], { type: g.type }),
          `garment-${i}.${g.type.split("/")[1]}`,
        ),
      );
      const response = await fetch(`${apiBase}/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(240000),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(
          "[try-on] upstream status",
          response.status,
          text.slice(0, 160).replaceAll(apiKey, "[redacted]"),
        );
        throw new Error(
          response.status === 429
            ? "换装服务繁忙，请稍后重试。"
            : response.status === 401
              ? "换装服务密钥无效，请检查服务器配置。"
              : `换装生成失败（${response.status}），请重试。`,
        );
      }
      const result = await response.json();
      const image = result.data?.[0];
      let generated;
      if (image?.b64_json) generated = Buffer.from(image.b64_json, "base64");
      else if (image?.url) {
        const url = new URL(image.url);
        if (url.protocol !== "https:")
          throw new Error("模型返回了无效图片地址。");
        const download = await fetch(url, {
          signal: AbortSignal.timeout(30000),
        });
        if (!download.ok) throw new Error("换装图片下载失败，请重试。");
        generated = Buffer.from(await download.arrayBuffer());
      } else throw new Error("模型没有返回图片，请重试。");
      job.generated = Date.now();
      await fs.mkdir(cache, { recursive: true });
      const rawPath = path.join(cache, `${job.id}-raw.png`);
      await sharp(generated).png().toFile(rawPath);
      job.status = "finishing";
      let transparent = false;
      const cutoutPath = path.join(cache, `${job.id}-cutout.png`);
      if (process.platform === "darwin") {
        try {
          await execute(
            "/usr/bin/swift",
            [path.join(root, "scripts/cutout.swift"), rawPath, cutoutPath],
            { timeout: 60000, maxBuffer: 1024 * 1024 },
          );
          transparent = true;
        } catch (error) {
          console.error(
            "[try-on] foreground extraction unavailable:",
            error.code || "processing error",
          );
        }
      }
      const output = path.join(cache, `${job.id}.webp`);
      let pipeline = sharp(transparent ? cutoutPath : rawPath);
      if (transparent)
        pipeline = pipeline.trim({ background: "#00000000", threshold: 10 });
      await pipeline
        .resize({ height: 1600, withoutEnlargement: true })
        .webp({ quality: 91 })
        .toFile(output);
      const metadata = await sharp(output).metadata();
      job.status = "complete";
      job.transparent = transparent;
      job.aspect = metadata.width / metadata.height;
      job.finished = Date.now();
      job.timings = {
        queueMs: job.started - job.created,
        modelMs: job.generated - job.started,
        processingMs: job.finished - job.generated,
        totalMs: job.finished - job.created,
      };
      await fs.writeFile(
        path.join(cache, `${job.id}.json`),
        JSON.stringify({
          id: job.id,
          status: job.status,
          transparent,
          aspect: job.aspect,
          finished: job.finished,
          timings: job.timings,
        }),
      );
    } catch (error) {
      job.status = "error";
      job.error =
        error.name === "TimeoutError"
          ? "换装生成超时，请重试。"
          : error.message;
    } finally {
      delete job.person;
      delete job.garments;
      running--;
      pump();
    }
  }
  function pump() {
    if (running >= 2) return;
    const job = [...jobs.values()].find((j) => j.status === "queued");
    if (job) void processJob(job);
  }
  function publicJob(job) {
    return {
      id: job.id,
      status: job.status,
      error: job.error,
      transparent: job.transparent,
      aspect: job.aspect,
      image:
        job.status === "complete" ? `/api/tryon/image/${job.id}` : undefined,
      elapsed:
        job.status === "complete"
          ? Math.floor((job.timings?.totalMs || 0) / 1000)
          : Math.floor((Date.now() - (job.created || Date.now())) / 1000),
      timings: job.timings,
    };
  }

  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/tryon")) return next();
    try {
      if (req.method === "POST" && req.headers.origin) {
        let originHost;
        try {
          originHost = new URL(req.headers.origin).host;
        } catch {
          return send(res, 403, { error: "请求来源无效。" });
        }
        if (originHost !== req.headers.host)
          return send(res, 403, { error: "请从当前试衣室页面发起请求。" });
      }
      if (req.method === "GET" && url.pathname === "/api/tryon/config")
        return send(res, 200, {
          configured: !!apiKey,
          model: apiKey ? model : null,
          foreground: process.platform === "darwin",
        });
      if (req.method === "POST" && url.pathname === "/api/tryon/prepare") {
        const chunks = [];
        let length = 0;
        for await (const chunk of req) {
          length += chunk.length;
          if (length > 18 * 1024 * 1024)
            return send(res, 413, { error: "照片过大。" });
          chunks.push(chunk);
        }
        const input = JSON.parse(Buffer.concat(chunks).toString());
        const person = await readImage(input.person);
        const id = crypto
          .createHash("sha256")
          .update("local-person-prepare")
          .update(person.bytes)
          .digest("hex")
          .slice(0, 32);
        const output = path.join(cache, `${id}.webp`);
        try {
          await fs.access(output);
          return send(res, 200, {
            image: `/api/tryon/image/${id}`,
            transparent: process.platform === "darwin",
          });
        } catch {}
        if (!preparations.has(id))
          preparations.set(
            id,
            (async () => {
              await fs.mkdir(cache, { recursive: true });
              const inputPath = path.join(cache, `${id}-input.png`),
                cutoutPath = path.join(cache, `${id}-cutout.png`);
              await sharp(person.bytes).png().toFile(inputPath);
              if (process.platform !== "darwin")
                return { image: input.person, transparent: false };
              await execute(
                "/usr/bin/swift",
                [
                  path.join(root, "scripts/cutout.swift"),
                  inputPath,
                  cutoutPath,
                ],
                { timeout: 60000, maxBuffer: 1024 * 1024 },
              );
              await sharp(cutoutPath)
                .trim({ background: "#00000000", threshold: 10 })
                .resize({ height: 1600, withoutEnlargement: true })
                .webp({ quality: 91 })
                .toFile(output);
              return { image: `/api/tryon/image/${id}`, transparent: true };
            })().finally(() => preparations.delete(id)),
          );
        return send(res, 200, await preparations.get(id));
      }
      const imageMatch = /^\/api\/tryon\/image\/([a-f0-9]{32})$/.exec(
        url.pathname,
      );
      if (req.method === "GET" && imageMatch) {
        try {
          const image = await fs.readFile(
            path.join(cache, `${imageMatch[1]}.webp`),
          );
          res.setHeader("Content-Type", "image/webp");
          res.setHeader("Cache-Control", "private, max-age=86400");
          res.end(image);
        } catch {
          return send(res, 404, { error: "换装图片已过期，请重新生成。" });
        }
        return;
      }
      const jobMatch = /^\/api\/tryon\/jobs\/([a-f0-9]{32})$/.exec(
        url.pathname,
      );
      if (req.method === "GET" && jobMatch) {
        let job = jobs.get(jobMatch[1]);
        if (!job) {
          try {
            job = JSON.parse(
              await fs.readFile(
                path.join(cache, `${jobMatch[1]}.json`),
                "utf8",
              ),
            );
          } catch {
            return send(res, 404, { error: "换装任务不存在，请重试。" });
          }
        }
        return send(res, 200, publicJob(job));
      }
      if (
        req.method === "POST" &&
        ["/api/tryon", "/api/tryon/cache"].includes(url.pathname)
      ) {
        const cacheOnly = url.pathname.endsWith("/cache");
        if (!apiKey && !cacheOnly)
          return send(res, 503, {
            error: "服务器尚未配置图像模型密钥。请设置 TRYON_API_KEY 后重启。",
          });
        let length = 0;
        const chunks = [];
        for await (const chunk of req) {
          length += chunk.length;
          if (length > 36 * 1024 * 1024)
            return send(res, 413, { error: "上传内容过大，请减少图片尺寸。" });
          chunks.push(chunk);
        }
        const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (
          !Array.isArray(input.garments) ||
          input.garments.length < 1 ||
          input.garments.length > 6
        )
          throw new Error("请选择 1–6 件衣物再试穿。");
        const person = await readImage(input.person);
        const garments = await Promise.all(
          input.garments.map(async (g) => {
            if (!allowedCategories.has(g.category))
              throw new Error("不支持的衣物分类。");
            return {
              ...(await readImage(g.image)),
              name: String(g.name || "衣物").slice(0, 80),
              category: g.category,
            };
          }),
        );
        const fingerprint = crypto
          .createHash("sha256")
          .update(instructionsVersion)
          .update(model)
          .update(person.bytes);
        garments.forEach((g) => fingerprint.update(g.category).update(g.bytes));
        const id = fingerprint.digest("hex").slice(0, 32);
        let job = jobs.get(id);
        if (!job) {
          try {
            job = JSON.parse(
              await fs.readFile(path.join(cache, `${id}.json`), "utf8"),
            );
          } catch {}
        }
        // A matching request may have queued while the disk lookup was pending.
        job = jobs.get(id) || job;
        if (job && job.status !== "error")
          return send(res, 200, publicJob(job));
        if (cacheOnly) return send(res, 200, { status: "idle" });
        if (
          [...jobs.values()].filter((j) =>
            ["queued", "generating", "finishing"].includes(j.status),
          ).length >= 6
        )
          return send(res, 429, {
            error: "还有几套搭配正在生成，请稍后再试。",
          });
        job = { id, status: "queued", created: Date.now(), person, garments };
        jobs.set(id, job);
        pump();
        return send(res, 202, publicJob(job));
      }
      return send(res, 404, { error: "接口不存在。" });
    } catch (error) {
      return send(res, 400, { error: error.message || "请求无法处理。" });
    }
  };
}

export function tryOnPlugin(root, env) {
  const middleware = createTryOnMiddleware(root, env);
  return {
    name: "muse-try-on",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
