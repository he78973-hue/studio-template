// Vite replaces BASE_URL at build time; Node tests use the relative fallback.
export const assetUrl = path => `${import.meta.env?.BASE_URL || './'}${path.replace(/^\/+/, '')}`;
