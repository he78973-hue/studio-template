export const SELECTION_SETTLE_MS = 400;

export function waitFor(ms, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

// onload also settles in background tabs; Image.decode() can wait for a frame.
export function loadTryOnImage(src, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      image.onload = image.onerror = null;
      if (error) reject(error);
      else resolve(image);
    };
    const cancel = () => finish(signal.reason);
    const timer = setTimeout(
      () => finish(new Error("试穿图片加载超时，请重试。")),
      15000,
    );
    image.onload = () => finish();
    image.onerror = () => finish(new Error("试穿图片未能加载，请重试。"));
    signal.addEventListener("abort", cancel, { once: true });
    image.src = src;
  });
}

export function createTryOnClient({
  fetcher = (...args) => fetch(...args),
  loadImage = loadTryOnImage,
  wait = waitFor,
  now = () => performance.now(),
} = {}) {
  // Keep decoded images warm, but never retain the full uploaded base64 as keys.
  const results = new Map();
  async function request(
    person,
    garments,
    { signal, generate = false, onStatus = () => {} },
  ) {
    const started = now();
    signal.throwIfAborted();
    if (!garments.length) return { status: "idle" };
    const sorted = [...garments].sort((a, b) => a.id.localeCompare(b.id));
    const body = JSON.stringify({ person, garments: sorted });
    // LAN HTTP previews may not expose SubtleCrypto. Keep disk-cache/inference
    // functional there; never substitute a collision-prone identity hash.
    const digest = globalThis.crypto?.subtle
      ? await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body))
      : null;
    const key =
      digest &&
      [...new Uint8Array(digest)]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
    signal.throwIfAborted();
    if (results.has(key)) {
      const hit = results.get(key);
      results.delete(key);
      results.set(key, hit);
      return { ...hit.job, cached: true, cacheSource: "memory" };
    }
    const json = async (url, init) => {
      const response = await fetcher(url, {
        ...init,
        signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      });
      const data = await response.json();
      signal.throwIfAborted();
      if (!response.ok)
        throw new Error(data.error || "试穿服务暂时无法连接，请重试。");
      return data;
    };
    const post = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    };
    // A disk-cache hit or an already-running job must bypass the selection delay.
    let job = await json("/api/tryon/cache", post);
    const cached = job.status === "complete";
    if (job.status === "idle") {
      if (!generate) return job;
      await wait(Math.max(0, SELECTION_SETTLE_MS - (now() - started)), signal);
      job = await json("/api/tryon", post);
    }
    for (let count = 0; count < 480; count++) {
      signal.throwIfAborted();
      if (job.status === "error")
        throw new Error(job.error || "试穿失败，请重试。");
      if (job.status === "complete") {
        const element = await loadImage(job.image, signal);
        signal.throwIfAborted();
        if (key) results.set(key, { job, element });
        if (results.size > 12) results.delete(results.keys().next().value);
        return { ...job, cached, cacheSource: cached ? "disk" : "generated" };
      }
      if (
        !["queued", "generating", "finishing"].includes(job.status) ||
        !job.id
      )
        throw new Error("试穿任务状态异常，请重试。");
      onStatus(job);
      await wait(job.status === "finishing" ? 350 : 1000, signal);
      job = await json(`/api/tryon/jobs/${job.id}`);
    }
    throw new Error("换装等待时间较长，请稍后重试；已完成的结果会自动复用。");
  }
  return { request };
}
