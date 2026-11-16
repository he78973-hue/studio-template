import { moods, categories } from "./data.js";

export function toggleGarment(selected, item, garments) {
  if (selected.includes(item.id))
    return selected.filter((id) => id !== item.id);
  const conflicts =
    item.category === "dress"
      ? ["dress", "top", "bottom"]
      : ["top", "bottom"].includes(item.category)
        ? [item.category, "dress"]
        : [item.category];
  return [
    ...selected.filter((id) => {
      const existing = garments.find((g) => g.id === id);
      return existing && !conflicts.includes(existing.category);
    }),
    item.id,
  ];
}

export function recommendOutfit(
  garments,
  { mood, weather, occasion },
  variation = 0,
) {
  const palette = moods.find((m) => m.id === mood)?.colors || [];
  const desiredWarmth =
    weather.temperature < 15 ? 3 : weather.temperature < 24 ? 2 : 1;
  const score = (item) =>
    (item.moods.includes(mood) ? 5 : 0) +
    (item.occasions.includes(occasion) ? 3 : 0) +
    (palette.includes(item.color) ? 2 : 0) +
    (item.source === "user" ? 2 : 0) -
    (item.category === "bag" ? 0 : Math.abs(item.warmth - desiredWarmth) * 3) -
    (weather.condition === "rainy" &&
    item.category === "shoes" &&
    item.rainSafe === false
      ? 12
      : 0);
  const byCategory = (category) =>
    garments
      .filter(
        (g) =>
          g.category === category &&
          !(
            category === "shoes" &&
            ["rainy", "snowy"].includes(weather.condition) &&
            g.rainSafe === false
          ),
      )
      .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  const tops = byCategory("top"),
    bottoms = byCategory("bottom"),
    dresses = byCategory("dress");
  const candidates = [
    ...tops.flatMap((t) =>
      bottoms.map((b) => ({ items: [t, b], score: score(t) + score(b) })),
    ),
    ...dresses.map((d) => ({ items: [d], score: score(d) * 2 })),
  ].sort((a, b) => b.score - a.score);
  const missing = [];
  let chosen;
  if (candidates.length)
    chosen = [...candidates[variation % candidates.length].items];
  else {
    chosen = [tops[0], bottoms[0]].filter(Boolean);
    if (!tops.length) missing.push("上装或连衣裙");
    if (!bottoms.length) missing.push("下装或连衣裙");
  }
  for (const category of ["outer", "shoes", "bag"]) {
    if (category === "outer" && weather.temperature >= 20) continue;
    const options = byCategory(category);
    if (options.length)
      chosen.push(options[variation % Math.min(2, options.length)]);
    else if (category !== "bag")
      missing.push(categories.find((c) => c.id === category).label);
  }
  const moodLabel = moods.find((m) => m.id === mood)?.label || "喜欢的风格";
  const warmthText =
    weather.temperature < 15
      ? "天气偏凉，优先保暖材质和叠穿"
      : weather.temperature > 25
        ? "天气偏暖，优先轻薄透气的单品"
        : "温度刚刚好，选择适中的厚度";
  const weatherNote =
    weather.condition === "rainy"
      ? "；雨天记得带伞，并留意鞋履防滑"
      : weather.condition === "snowy"
        ? "；雪天请额外做好防寒与防滑"
        : "";
  return {
    ids: chosen.map((g) => g.id),
    missing,
    title: `${moodLabel}，刚好是你`,
    reason: `${warmthText}${weatherNote}。结合「${moodLabel}」的色彩偏好，为${occasion}组合这 ${chosen.length} 件单品。`,
  };
}
