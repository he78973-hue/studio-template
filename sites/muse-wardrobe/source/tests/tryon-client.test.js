import test from "node:test";
import assert from "node:assert/strict";
import {
  createTryOnClient,
  SELECTION_SETTLE_MS,
  waitFor,
} from "../src/lib/tryOnClient.js";

const top = {
  id: "top",
  name: "Top",
  category: "top",
  image: "/images/top.webp",
};
const shoes = {
  id: "shoes",
  name: "Shoes",
  category: "shoes",
  image: "/images/shoes.webp",
};
const done = {
  id: "cached",
  status: "complete",
  image: "/api/tryon/image/cached",
  transparent: true,
};
const response = (value) =>
  new Response(JSON.stringify(value), { status: 200 });
const options = (extra) => ({ signal: new AbortController().signal, ...extra });

test("non-secure preview origins can still retrieve outfits without SubtleCrypto", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    value: {},
    configurable: true,
  });
  try {
    let calls = 0;
    const client = createTryOnClient({
      fetcher: async () => {
        calls++;
        return response(done);
      },
      loadImage: async () => ({}),
    });
    await client.request("person", [top], options());
    await client.request("person", [top], options());
    assert.equal(calls, 2);
  } finally {
    Object.defineProperty(globalThis, "crypto", descriptor);
  }
});

test("cached outfits bypass debounce, inference and repeat image loading, regardless of selection order", async () => {
  let requests = 0,
    loads = 0;
  const client = createTryOnClient({
    fetcher: async (url) => {
      requests++;
      assert.equal(url, "/api/tryon/cache");
      return response(done);
    },
    loadImage: async () => {
      loads++;
      return {};
    },
    wait: () => {
      throw new Error("Cache hits must not wait");
    },
  });
  assert.equal(
    (
      await client.request(
        "person-a",
        [top, shoes],
        options({ generate: true }),
      )
    ).cacheSource,
    "disk",
  );
  assert.equal(
    (
      await client.request(
        "person-a",
        [shoes, top],
        options({ generate: true }),
      )
    ).cacheSource,
    "memory",
  );
  assert.equal(requests, 1);
  assert.equal(loads, 1);
});

test("a different person or garment image cannot reuse a previous identity's memory result", async () => {
  let requests = 0;
  const client = createTryOnClient({
    fetcher: async () => {
      requests++;
      return response(done);
    },
    loadImage: async () => ({}),
  });
  await client.request("person-a", [top], options());
  await client.request("person-b", [top], options());
  await client.request(
    "person-b",
    [{ ...top, image: "/images/replaced.webp" }],
    options(),
  );
  assert.equal(requests, 3);
});

test("startup cache misses and empty/reset selections never submit generation", async () => {
  const paths = [];
  const client = createTryOnClient({
    fetcher: async (url) => {
      paths.push(url);
      return response({ status: "idle" });
    },
  });
  assert.equal(
    (await client.request("person", [], options({ generate: true }))).status,
    "idle",
  );
  assert.equal(
    (await client.request("person", [top], options())).status,
    "idle",
  );
  assert.deepEqual(paths, ["/api/tryon/cache"]);
});

test("a changed selection aborts during settling instead of creating an obsolete generation", async () => {
  const controller = new AbortController();
  let reachedWait;
  const waiting = new Promise((resolve) => {
    reachedWait = resolve;
  });
  const paths = [];
  const client = createTryOnClient({
    fetcher: async (url) => {
      paths.push(url);
      return response({ status: "idle" });
    },
    wait: (ms, signal) => {
      reachedWait(ms);
      return waitFor(10000, signal);
    },
  });
  const request = client.request("person", [top], {
    signal: controller.signal,
    generate: true,
  });
  await waiting;
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.deepEqual(paths, ["/api/tryon/cache"]);
});

test("reload resumes an existing job without creating another inference request", async () => {
  const paths = [],
    waits = [],
    phases = [];
  const client = createTryOnClient({
    fetcher: async (url) => {
      paths.push(url);
      return response(
        paths.length === 1 ? { id: "running", status: "finishing" } : done,
      );
    },
    loadImage: async () => ({}),
    wait: async (ms) => {
      waits.push(ms);
    },
  });
  await client.request(
    "person",
    [top],
    options({ onStatus: (job) => phases.push(job.status) }),
  );
  assert.deepEqual(paths, ["/api/tryon/cache", "/api/tryon/jobs/running"]);
  assert.deepEqual(waits, [350]);
  assert.deepEqual(phases, ["finishing"]);
});

test("new outfits settle for at most 400ms, then poll the real job", async () => {
  const paths = [],
    waits = [];
  const values = [
    { status: "idle" },
    { id: "new", status: "generating" },
    done,
  ];
  const client = createTryOnClient({
    fetcher: async (url) => {
      paths.push(url);
      return response(values.shift());
    },
    loadImage: async () => ({}),
    wait: async (ms) => {
      waits.push(ms);
    },
    now: () => 0,
  });
  const result = await client.request(
    "person",
    [top],
    options({ generate: true }),
  );
  assert.equal(result.cacheSource, "generated");
  assert.deepEqual(paths, [
    "/api/tryon/cache",
    "/api/tryon",
    "/api/tryon/jobs/new",
  ]);
  assert.deepEqual(waits, [SELECTION_SETTLE_MS, 1000]);
});

test("late image completion after reset cannot publish or poison the result cache", async () => {
  let finishLoad, startedLoad;
  const loading = new Promise((resolve) => {
    startedLoad = resolve;
  });
  let requests = 0;
  const controller = new AbortController();
  const client = createTryOnClient({
    fetcher: async () => {
      requests++;
      return response(done);
    },
    loadImage: async () => {
      if (requests > 1) return {};
      startedLoad();
      return new Promise((resolve) => {
        finishLoad = resolve;
      });
    },
  });
  const request = client.request("person", [top], {
    signal: controller.signal,
  });
  await loading;
  controller.abort();
  finishLoad({});
  await assert.rejects(request, { name: "AbortError" });
  await client.request("person", [top], options());
  assert.equal(requests, 2);
});

test("a service failure preserves its recovery message and remains retryable", async () => {
  let fail = true;
  const client = createTryOnClient({
    fetcher: async () =>
      fail
        ? new Response(JSON.stringify({ error: "请稍后重试" }), { status: 503 })
        : response(done),
    loadImage: async () => ({}),
  });
  await assert.rejects(
    client.request("person", [top], options()),
    /请稍后重试/,
  );
  fail = false;
  assert.equal(
    (await client.request("person", [top], options({ generate: true }))).status,
    "complete",
  );
});
