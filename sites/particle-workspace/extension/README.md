# Particle collector — local development version

1. Serve the template over HTTP(S), for example `python3 -m http.server 4173 --bind 127.0.0.1` from `sites/particle-workspace/`.
2. Open `chrome://extensions` or `edge://extensions` and enable developer mode.
3. Load this unpacked folder (the one containing manifest.json).
4. On a normal web page, right-click an image, link or page and select **保存到粒子 Particle**.
5. Particle opens or focuses its tab. Confirm the captured item to save it.

The default destination is `http://localhost:4173/`. When serving the repository root or using a deployed site, set the extension popup to the full template-directory URL, including `/sites/particle-workspace/` where appropriate. Use the same origin and template path you normally browse (localhost and 127.0.0.1 are separate browser storage origins).

Uses contextMenus to expose the action, tabs to find/reuse the Particle tab, and storage to keep the configured app URL. There are no broad content script or host permissions. No content is collected until the user invokes the menu. The website asks for confirmation before importing. A cross-origin image that cannot be fetched is kept as a remote image reference; it may not be available offline. Internal browser pages do not expose normal web context menus.
