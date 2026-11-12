// Browser-only regression checks. Run on a visible, built Weather Garden page.
(async () => {
  const checks = [], assert = (name, ok) => { checks.push({ name, ok }); if (!ok) throw Error(name); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (predicate, name, timeout = 17000) => { const end = performance.now() + timeout; while (!predicate()) { if (performance.now() > end) throw Error('Timeout: ' + name); await wait(80); } };
  const q = selector => document.querySelector(selector), debug = window.__weatherDebug;
  assert('application initialized', !!debug);
  assert('browser tab visible', document.visibilityState === 'visible');
  await until(() => !debug.state().loading, 'initial forecast');
  assert('forecast or dated fallback available', debug.state().hours.length > 0);
  assert('source is explicitly labelled', q('#statusText').textContent.length > 8);
  const stateBefore = debug.state();
  for (const [metric, unit] of [['temperature', '°C'], ['precipitation', 'mm'], ['wind', 'm/s']]) {
    q(`[data-metric="${metric}"]`).click();
    assert(`${metric}: selected state`, debug.state().metric === metric);
    assert(`${metric}: exactly one active tab`, document.querySelectorAll('[data-metric][aria-pressed="true"]').length === 1);
    assert(`${metric}: units visible`, q('#chartKey').textContent.includes(unit));
  }
  const slider = q('#hourRange'); slider.value = '5'; slider.dispatchEvent(new Event('input', { bubbles: true }));
  const selected = debug.state();
  assert('hour slider selects requested index', selected.hour === 5);
  assert('temperature matches selected forecast', q('#temperature').textContent === selected.hours[5].temperature.toFixed(0));
  assert('forecast period is distinguished from current', q('#periodLabel').textContent.includes('预报') && !q('#returnNow').hidden && q('#detailPeriod').textContent.includes('所选预报') && q('#solarPeriod').textContent === q('#detailPeriod').textContent);
  assert('accessible chart table has forecast rows', q('#hourAccessible tbody').children.length === selected.hours.length);
  q('#returnNow').click(); assert('return to now resets selection', debug.state().hour === -1 && q('#returnNow').hidden);
  q('[data-day="2"]').click(); assert('day details open', q('#dayDialog').open && q('#dayDetails').textContent.includes('预报降水量'));
  q('[data-close="dayDialog"]').click(); assert('day details close', !q('#dayDialog').open);
  q('#cityButton').focus(); q('#cityButton').click();
  assert('city sheet opens', q('#cityDialog').open);
  q('#citySearch').value = '未收录城市'; q('#citySearch').dispatchEvent(new Event('input', { bubbles: true }));
  assert('city search empty state is honest', !q('#cityList [data-city]') && q('#cityList').textContent.includes('暂未收录'));
  q('[data-close="cityDialog"]').click(); assert('city close restores focus', document.activeElement === q('#cityButton'));
  const scene = debug.scene();
  if (scene) {
    q('#weatherCanvas').scrollIntoView({ block: 'center', behavior: 'instant' });
    await until(() => scene.visible, '3D scene visible');
    const originalKind = scene.kind, originalReading = { ...scene.reading };
    const kinds = ['sun', 'partly', 'cloud', 'moon', 'rain', 'snow', 'storm', 'fog'];
    for (const kind of kinds) { scene.setWeather(kind, originalReading, true); await wait(80); }
    const memory = { ...scene.renderer.info.memory };
    for (const kind of [...kinds, ...kinds]) { scene.setWeather(kind, originalReading, true); await wait(60); }
    assert('weather changes reuse GPU geometries', scene.renderer.info.memory.geometries === memory.geometries);
    assert('weather changes reuse textures', scene.renderer.info.memory.textures === memory.textures);
    scene.setWeather(originalKind, originalReading, true);
    if (q('#windToggle').getAttribute('aria-pressed') !== 'true') q('#windToggle').click();
    await wait(200); assert('wind toggle is wired', scene.windEnabled && q('#windToggle').getAttribute('aria-pressed') === 'true');
    scene.targetYaw = .9; await wait(160); scene.reset(); await wait(1000);
    assert('rotation returns to center', Math.abs(scene.yaw) < .015 && Math.abs(scene.pitch) < .015);
  }
  const originalFetch = window.fetch;
  try {
    const previousTemperature = debug.state().selected.temperature;
    window.fetch = (url, options) => String(url).startsWith('https://api.open-meteo.com/') ? Promise.reject(new TypeError('Controlled offline test')) : originalFetch(url, options);
    await debug.refresh();
    assert('failed refresh keeps same-city data', debug.state().selected.temperature === previousTemperature);
    assert('failure has recovery copy', !q('#errorMessage').hidden && !debug.state().loading);
    assert('failed refresh does not claim fresh data', debug.state().source !== 'live');
  } finally { window.fetch = originalFetch; }
  await debug.refresh();
  assert('refresh recovers or explicitly retains fallback', !debug.state().loading && !!debug.state().selected);
  assert('no horizontal page overflow', document.documentElement.scrollWidth <= innerWidth);
  const activeButtons = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width && !b.closest('dialog:not([open])'));
  assert('visible buttons have 44px hit height', activeButtons.every(b => b.getBoundingClientRect().height >= 43.5));
  q('[data-metric="temperature"]').click();
  if (q('#windToggle').getAttribute('aria-pressed') === 'true') q('#windToggle').click();
  window.scrollTo({ top: 0, behavior: 'instant' });
  return { passed: checks.length, failures: [], source: debug.state().source, city: debug.state().city, threeAvailable: !!scene, initialSource: stateBefore.source };
})()
