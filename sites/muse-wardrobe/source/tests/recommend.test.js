import test from "node:test";
import assert from "node:assert/strict";
import { recommendOutfit, toggleGarment } from "../src/lib/recommend.js";
import { demoGarments, initialState } from "../src/lib/data.js";

test("dress selection excludes separates, and separates remove the dress", () => {
  const dress = { id: "my-dress", category: "dress" };
  const items = [...demoGarments, dress];
  const selected = toggleGarment(initialState.selected, dress, items);
  assert(selected.includes("my-dress"));
  assert(!selected.includes("knit-pink"));
  assert(!selected.includes("pants-beige"));
  assert(selected.includes("bag-brown"));
  const next = toggleGarment(selected, demoGarments[0], items);
  assert(!next.includes("my-dress"));
  assert(next.includes("knit-pink"));
});

test("cold weather adds a layer and chooses warmer tops; hot weather chooses light clothes", () => {
  const cold = recommendOutfit(demoGarments, {
    ...initialState,
    mood: "calm",
    weather: { temperature: 7, condition: "cloudy" },
  });
  const hot = recommendOutfit(demoGarments, {
    ...initialState,
    mood: "calm",
    weather: { temperature: 31, condition: "sunny" },
  });
  assert(
    cold.ids.some(
      (id) => demoGarments.find((g) => g.id === id).category === "outer",
    ),
  );
  assert(
    !hot.ids.some(
      (id) => demoGarments.find((g) => g.id === id).category === "outer",
    ),
  );
  const top = (result) =>
    demoGarments.find((g) => result.ids.includes(g.id) && g.category === "top");
  assert(top(cold).warmth > top(hot).warmth);
});

test("mood affects the recommendation when weather and occasion are equal", () => {
  const romantic = recommendOutfit(demoGarments, {
    ...initialState,
    mood: "romantic",
  });
  const confident = recommendOutfit(demoGarments, {
    ...initialState,
    mood: "confident",
  });
  assert.notDeepEqual(romantic.ids, confident.ids);
  assert(romantic.reason.includes("温柔浪漫"));
});

test("empty wardrobe returns actionable missing categories instead of a fake complete outfit", () => {
  const result = recommendOutfit([], initialState);
  assert.deepEqual(result.ids, []);
  assert(result.missing.includes("上装或连衣裙"));
  assert(result.missing.includes("下装或连衣裙"));
});

test("uploaded-only recommendations never invent items; sparse data remains honest", () => {
  const user = { ...demoGarments[0], id: "uploaded-knit", source: "user" };
  const result = recommendOutfit([user], initialState);
  assert.deepEqual(result.ids, ["uploaded-knit"]);
  assert(result.missing.length > 0);
});

test("rain recommendation avoids the explicitly non-rain-safe sandal", () => {
  for (let n = 0; n < 5; n++) {
    const result = recommendOutfit(
      demoGarments,
      { ...initialState, weather: { temperature: 27, condition: "rainy" } },
      n,
    );
    assert(result.ids.includes("boots-beige"));
    assert(!result.ids.includes("sandals"));
    assert(result.reason.includes("雨天"));
  }
});

test("repeated recommendations stay valid and use at most one piece per category", () => {
  for (let n = 0; n < 25; n++) {
    const result = recommendOutfit(demoGarments, initialState, n);
    const categories = result.ids.map(
      (id) => demoGarments.find((g) => g.id === id).category,
    );
    assert.equal(categories.length, new Set(categories).size);
    assert(categories.includes("top") && categories.includes("bottom"));
  }
});
