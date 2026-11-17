// Respect the document's location and Studio's injected <base> URL.
export const assetURL = name => new URL(`assets/${name}`, document.baseURI).href;
