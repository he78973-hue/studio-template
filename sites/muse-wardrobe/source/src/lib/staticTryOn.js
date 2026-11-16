import { assetPath } from "./runtime.js";
import { loadTryOnImage } from "./tryOnClient.js";

export const demoLooks = [
  {
    items: ["bag-brown", "boots-beige", "knit-pink", "pants-beige"],
    image: "look-pink-full.webp",
  },
  { items: ["knit-pink"], image: "look-pink-top.webp" },
];

export function findDemoLook(person, garments) {
  if (person !== "/images/model-alternate.jpg" || !garments.length) return null;
  // A user upload, even with a matching garment name, is not a generated demo.
  if (garments.some((g) => g.image !== assetPath(`images/${g.id}.webp`)))
    return null;
  const ids = garments
    .map((g) => g.id)
    .sort()
    .join("|");
  return (
    demoLooks.find((look) => [...look.items].sort().join("|") === ids) || null
  );
}

export function createStaticTryOnClient() {
  return {
    async request(person, garments, { signal }) {
      signal.throwIfAborted();
      const look = findDemoLook(person, garments);
      if (!look) return { status: "idle" };
      const image = assetPath(`images/${look.image}`);
      await loadTryOnImage(image, signal);
      signal.throwIfAborted();
      return {
        status: "complete",
        image,
        transparent: true,
        cached: true,
        cacheSource: "bundled",
      };
    },
  };
}
