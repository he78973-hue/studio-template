import test from "node:test";
import assert from "node:assert/strict";
import { demoGarments, initialState } from "../src/lib/data.js";
import { findDemoLook } from "../src/lib/staticTryOn.js";
const outfit = demoGarments.filter((g) => initialState.selected.includes(g.id));
test("the exact public demo outfit resolves independent of selection order", () => {
  assert.equal(
    findDemoLook("/images/model-alternate.jpg", [...outfit].reverse()).image,
    "look-pink-full.webp",
  );
});
test("uploaded people, altered garment images and unsupported combinations never masquerade as generated results", () => {
  assert.equal(findDemoLook("data:image/webp;base64,user", outfit), null);
  assert.equal(
    findDemoLook(
      "/images/model-alternate.jpg",
      outfit.map((g, i) =>
        i ? g : { ...g, image: "data:image/webp;base64,user" },
      ),
    ),
    null,
  );
  assert.equal(
    findDemoLook("/images/model-alternate.jpg", outfit.slice(1)),
    null,
  );
  assert.equal(findDemoLook("/images/model-alternate.jpg", []), null);
});
