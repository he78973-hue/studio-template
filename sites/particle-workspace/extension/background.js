const DEFAULT_APP = 'http://localhost:4173/';
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'save-particle', title: '保存到粒子 Particle', contexts: ['image', 'link', 'page'] });
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-particle') return;
  const { appURL = DEFAULT_APP } = await chrome.storage.local.get('appURL');
  const app = new URL(appURL);
  const params = new URLSearchParams({ url: info.linkUrl || info.pageUrl || tab.url, title: tab.title || '' });
  if (info.mediaType === 'image' && info.srcUrl) params.set('image', info.srcUrl);
  app.hash = `capture?${params}`;
  const tabs = await chrome.tabs.query({ url: `${app.origin}/*` });
  const existing = tabs.find(t => new URL(t.url).pathname === app.pathname);
  if (existing) {
    await chrome.tabs.update(existing.id, { url: app.href, active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: app.href });
  }
});
