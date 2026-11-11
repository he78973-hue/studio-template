// Controlled request failure/cancellation tests; no synthetic forecast values are generated.
(async () => {
  const debug = window.__weatherDebug, originalFetch = window.fetch;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (test, label) => { const end = performance.now() + 17000; while (!test()) { if (performance.now() > end) throw Error(label); await wait(60); } };
  const choose = id => {
    document.querySelector('#cityButton').click();
    document.querySelector(`[data-city="${id}"]`).click();
  };
  const results = [];
  const check = (name, ok) => { if (!ok) throw Error(name); results.push(name); };
  let aborted = false;
  try {
    await until(() => !debug.state().loading, 'initial load');
    if (debug.state().city !== 'shanghai') { choose('shanghai'); await until(() => !debug.state().loading, 'Shanghai baseline'); }
    window.fetch = (url, options) => {
      if (String(url).startsWith('https://api.open-meteo.com/') && new URL(url).searchParams.get('latitude') === '30.27') {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Controlled cancellation', 'AbortError')); }, { once: true });
        });
      }
      return originalFetch(url, options);
    };
    choose('hangzhou'); await wait(80); choose('beijing');
    await until(() => !debug.state().loading, 'winning city load');
    check('superseded city request aborted', aborted);
    check('last city remains selected', debug.state().city === 'beijing' && document.querySelector('#cityName').textContent === '北京');
    const beijingCache = JSON.parse(localStorage.getItem('qingyu.forecast.v1.beijing') || 'null');
    check('old city is not relabelled as new data', !debug.state().selected || (beijingCache?.cityId === 'beijing' && Math.abs(beijingCache.raw.latitude - 39.9) < 1 && debug.state().selected.temperature === beijingCache.raw.current.temperature_2m));
    window.fetch = (url, options) => String(url).startsWith('https://api.open-meteo.com/') ? Promise.reject(new TypeError('Controlled outage')) : originalFetch(url, options);
    localStorage.removeItem('qingyu.forecast.v1.chengdu');
    choose('chengdu'); await until(() => !debug.state().loading, 'uncached failure');
    check('uncached city does not inherit Shanghai snapshot', debug.state().city === 'chengdu' && debug.state().source === 'empty' && debug.state().selected == null);
    check('empty city shows missing values', document.querySelector('#temperature').textContent === '—' && document.querySelector('#hourRange').disabled && document.querySelector('#windToggle').disabled);
    check('retry remains available', !document.querySelector('#errorMessage').hidden && !document.querySelector('#retryButton').disabled);
  } finally {
    window.fetch = originalFetch;
    if (debug.state().city !== 'shanghai') choose('shanghai'); else await debug.refresh();
    await until(() => !debug.state().loading, 'restored live request');
  }
  return { passed: results.length, checks: results, restoredSource: debug.state().source, restoredCity: debug.state().city };
})()
