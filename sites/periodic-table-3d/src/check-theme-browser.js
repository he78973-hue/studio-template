// Run in the visible page: agent-browser eval --stdin < src/check-theme-browser.js
(async () => {
  if (!window.__ptState || document.visibilityState !== 'visible') throw Error('Open the atlas in a visible tab first');
  const results = [], check = (name, pass) => { results.push({ name, pass }); if (!pass) throw Error(name); };
  const frame = () => new Promise(requestAnimationFrame);
  const settle = async () => { await frame(); await frame(); };
  const choose = name => document.querySelector(`[data-theme-choice="${name}"]`).click();
  const state = () => window.__ptState();
  const initial = state().theme;
  if (state().view === 'atom') { window.__ptExitAtom(); await new Promise(r => setTimeout(r, 1400)); }
  for (const name of ['dark', 'light']) {
    choose(name); await settle();
    check(`${name}: state and root agree`, state().theme === name && document.documentElement.dataset.theme === name);
    check(`${name}: one pressed control`, document.querySelectorAll('[data-theme-choice][aria-pressed="true"]').length === 1);
    check(`${name}: preference stored`, localStorage.getItem('elementa-theme') === name);
    check(`${name}: no horizontal overflow`, document.documentElement.scrollWidth === innerWidth);
  }
  const gl = window.__ptDebug;
  let textureCount = null;
  if (gl && state().renderer !== 'canvas2d') {
    const meshes = []; gl.scene.traverse(o => { if (o.userData?.isTile) meshes.push(o); });
    check('118 interactive tiles unchanged', meshes.length === 118);
    const fe = meshes.find(m => m.userData.el.symbol === 'Fe');
    const texture = fe.material[4].map;
    const sample = () => Array.from(texture.image.getContext('2d').getImageData(12, 12, 1, 1).data).join(',');
    choose('dark'); await settle(); const darkPixel = sample();
    choose('light'); await settle(); const lightPixel = sample();
    check('same texture object is repainted', fe.material[4].map === texture && darkPixel !== lightPixel);
    textureCount = gl.renderer.info.memory.textures;
    for (let i = 0; i < 12; i++) { choose(i % 2 ? 'light' : 'dark'); await settle(); }
    check('12 switches do not grow texture count', textureCount === gl.renderer.info.memory.textures);
    choose('dark'); await settle(); check('dark texture restored exactly', sample() === darkPixel);
  }
  window.__ptEnterAtom('Fe');
  choose('light');
  check('switch during entry keeps Fe', state().element === 'Fe' && state().view === 'atom');
  await new Promise(r => setTimeout(r, 1500));
  check('Fe shell counts unchanged', JSON.stringify(state().shells) === '[2,8,14,2]');
  document.querySelector('#btn-nucleus').click();
  await new Promise(r => setTimeout(r, 1000));
  const before = state(), camera = gl && state().renderer !== 'canvas2d' ? gl.camera.position.toArray() : null;
  choose('dark');
  check('nucleus view survives theme switch', state().nucleusMode === before.nucleusMode && state().element === 'Fe');
  if (camera) check('switch does not move camera', JSON.stringify(camera) === JSON.stringify(gl.camera.position.toArray()));
  await settle();
  check('panel remains open', document.querySelector('#panel').classList.contains('show'));
  check('legend category retained', document.querySelector('#legend .active')?.dataset.cat === 'transition');
  document.querySelector('#btn-back').click();
  await new Promise(r => setTimeout(r, 1400));
  check('back returns to table', state().view === 'table' && !document.body.classList.contains('atom-view'));
  choose(initial); await settle();
  return { passed: results.length, mode: state().renderer || 'webgl', textureCount, failures: [] };
})()
