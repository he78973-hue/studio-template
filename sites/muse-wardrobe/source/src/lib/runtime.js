export const STATIC_DEMO = import.meta.env?.VITE_TEMPLATE_STATIC === "true";
const base = import.meta.env?.BASE_URL || "/";
export const assetPath = (name) => `${base}${name.replace(/^\/+/, "")}`;
export const createId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `muse-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
