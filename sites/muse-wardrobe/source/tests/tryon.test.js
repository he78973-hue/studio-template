import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createTryOnMiddleware, decodeDataImage } from "../server/tryon.js";

async function withServer(env, run) {
  const middleware = createTryOnMiddleware(process.cwd(), env);
  const server = http.createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end();
    }),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("image data URL parsing rejects unsupported or malformed values", () => {
  assert.throws(() => decodeDataImage("data:image/svg+xml;base64,PHN2Zz4="));
  assert.throws(() => decodeDataImage("https://example.com/photo.jpg"));
  assert.throws(() => decodeDataImage("data:image/png;base64,"));
  const value = decodeDataImage("data:image/png;base64,aGVsbG8=");
  assert.equal(value.type, "image/png");
  assert.equal(value.bytes.toString(), "hello");
});

test("cross-origin sites cannot use the configured image service", async () => {
  await withServer({ TRYON_API_KEY: "test-only" }, async (base) => {
    const response = await fetch(base + "/api/tryon", {
      method: "POST",
      headers: {
        Origin: "https://unrelated.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(response.status, 403);
  });
});

test("missing credentials are an explicit configuration error, never a fake result", async () => {
  await withServer({}, async (base) => {
    const config = await (await fetch(base + "/api/tryon/config")).json();
    assert.equal(config.configured, false);
    const response = await fetch(base + "/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /密钥/);
  });
});

test("external URLs and traversal cannot make the image endpoint read arbitrary files", async () => {
  await withServer({ TRYON_API_KEY: "test-only" }, async (base) => {
    for (const person of [
      "https://localhost/private",
      "/images/../../package.json",
      "/etc/passwd",
    ]) {
      const response = await fetch(base + "/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          garments: [{ category: "top", image: "/images/knit-pink.webp" }],
        }),
      });
      assert.equal(response.status, 400);
    }
    assert.equal(
      (await fetch(base + "/api/tryon/image/not-a-hash")).status,
      404,
    );
  });
});

test("cache-only lookup is available without credentials and never queues generation", async () => {
  await withServer({}, async (base) => {
    const response = await fetch(base + "/api/tryon/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person: "/images/model-alternate.jpg",
        garments: [
          {
            category: "top",
            name: "Pink knit",
            image: "/images/knit-pink.webp",
          },
        ],
      }),
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert(["idle", "complete"].includes(result.status));
  });
});

test("empty outfits and unsupported garment categories are rejected before generation", async () => {
  await withServer({ TRYON_API_KEY: "test-only" }, async (base) => {
    for (const garments of [
      [],
      [{ category: "unknown", image: "/images/knit-pink.webp" }],
    ]) {
      const response = await fetch(base + "/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: "/images/model-alternate.jpg",
          garments,
        }),
      });
      assert.equal(response.status, 400);
    }
  });
});
