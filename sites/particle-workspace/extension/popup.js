const form = document.getElementById('settings');
const status = document.getElementById('status');
chrome.storage.local.get('appURL').then(({ appURL }) => {
  if (appURL) { form.elements.url.value = appURL; document.getElementById('openApp').href = appURL; }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const url = new URL(form.elements.url.value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    url.hash = ''; url.search = '';
    await chrome.storage.local.set({ appURL: url.href });
    document.getElementById('openApp').href = url.href;
    status.textContent = '已保存。右键采集时会打开这个地址。';
  } catch { status.textContent = '请输入有效的 HTTP 或 HTTPS 地址。'; }
});
