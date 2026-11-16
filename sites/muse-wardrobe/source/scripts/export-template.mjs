import fs from "node:fs/promises";
import path from "node:path";
const source = path.resolve(import.meta.dirname, "..");
const target = path.resolve(source, "..");
const dist = path.join(source, "dist");
// Only generated runtime files are replaced. Source, notices and gallery media stay.
for (const entry of ["assets", "images", "index.html", "favicon.svg"]) {
  await fs.rm(path.join(target, entry), { recursive: true, force: true });
  await fs.cp(path.join(dist, entry), path.join(target, entry), {
    recursive: true,
  });
}
console.log(
  "Exported portable static entry and runtime assets to sites/muse-wardrobe.",
);
