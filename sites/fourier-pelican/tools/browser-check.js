// Run in the page: agent-browser eval --stdin < tools/browser-check.js
(async () => {
  const ft = window.__ft, cv = document.querySelector('#cv');
  const checks = [], failures = [];
  const check = (name, pass) => { checks.push({ name, pass }); if (!pass) failures.push(name); };
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  check('initialization', !!ft && !!cv);
  if (!ft || !cv) throw new Error('Page did not initialize');
  ft.seek(0); await nextFrame(); await nextFrame();
  check('monotonic error', ft.errors.every((p, i, a) => Number.isFinite(p.err) && (!i || p.err <= a[i - 1].err)));
  check('N=50 error below 0.2%', ft.errors.at(-1).err < 0.2);
  let maxProjectionError = 0, circleBoundsOK = true, penBoundsOK = true;
  for (let i = 0; i <= 520; i++) {
    const s = ft.state(i / 20);
    penBoundsOK &&= s.penX >= 0 && s.penX <= 960 && s.penY >= 0 && s.penY <= 1200;
    maxProjectionError = Math.max(maxProjectionError,
      Math.abs(ft.GREEN.x + s.green.end[0] * ft.S - s.penX),
      Math.abs(ft.GOLD.y + s.gold.end[0] * ft.S - s.penY));
    for (const [vectors, anchor, vertical] of [[s.green, ft.GREEN, false], [s.gold, ft.GOLD, true]]) {
      for (const c of vectors) {
        const x = anchor.x + (vertical ? c.cy : c.cx) * ft.S;
        const y = anchor.y + (vertical ? c.cx : c.cy) * ft.S, r = c.r * ft.S;
        circleBoundsOK &&= x - r >= 0 && x + r <= 960 && y - r >= 0 && y + r <= 1200;
      }
    }
  }
  check('521 samples: projections intersect at pen', maxProjectionError < 1e-9);
  check('521 samples: all circles and pen inside canvas', circleBoundsOK && penBoundsOK);
  const ctx = cv.getContext('2d'), originalArc = ctx.arc;
  let endpoints = [], renderedEndpointError = 0;
  ctx.arc = function(x, y, r, ...rest) {
    if (r === 2.6) {
      const m = this.getTransform(), scale = cv.width / 960;
      endpoints.push([(m.a * x + m.c * y + m.e) / scale, (m.b * x + m.d * y + m.f) / scale]);
    }
    return originalArc.call(this, x, y, r, ...rest);
  };
  try {
    for (const t of [1, 5.7, 10.5, 14.7, 17, 19.99]) {
      endpoints = [];
      const s = window.renderAt(t);
      const expected = [[s.penX, ft.GREEN.y + s.green.end[1] * ft.S], [ft.GOLD.x + s.gold.end[1] * ft.S, s.penY]];
      check(`two rendered endpoints at ${t}s`, endpoints.length === 2);
      endpoints.forEach((p, i) => { renderedEndpointError = Math.max(renderedEndpointError, Math.hypot(p[0] - expected[i][0], p[1] - expected[i][1])); });
    }
  } finally { ctx.arc = originalArc; }
  check('actual rendered circles meet projection starts', renderedEndpointError < 1e-9);
  for (const t of [0, 3.99, 8, 19.99, 21.5, 26]) {
    window.renderAt(t); const first = cv.toDataURL();
    window.renderAt(t); check(`deterministic pixels at ${t}s`, first === cv.toDataURL());
  }
  const play = document.querySelector('#btnPlay'), replay = document.querySelector('#btnReplay');
  ft.seek(12); await nextFrame(); await nextFrame();
  let draws = 0; const fillRect = ctx.fillRect;
  ctx.fillRect = function(...args) { draws++; return fillRect.apply(this, args); };
  await nextFrame(); await nextFrame(); await nextFrame(); ctx.fillRect = fillRect;
  check('paused canvas is not repainted', draws === 0 && ft.time() === 12);
  play.click(); check('play', ft.isPlaying()); play.click(); check('pause', !ft.isPlaying());
  replay.click(); check('replay starts at zero', ft.isPlaying() && ft.time() === 0);
  ft.seek(26); play.click(); check('play at end restarts', ft.isPlaying() && ft.time() === 0);
  ft.seek(12);
  const key = (key, code = key) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
  key('ArrowRight'); check('right arrow', ft.time() === 13);
  key('ArrowLeft'); check('left arrow', ft.time() === 12);
  key(' ', 'Space'); check('space plays', ft.isPlaying());
  key(' ', 'Space'); check('space pauses', !ft.isPlaying());
  key('r', 'KeyR'); check('R replays', ft.isPlaying() && ft.time() === 0);
  ft.seek(26);
  check('no horizontal overflow', document.documentElement.scrollWidth <= innerWidth);
  check('canvas has accessible description', cv.getAttribute('aria-label')?.includes('双脚'));
  const result = { passed: checks.filter(x => x.pass).length, total: checks.length, failures, maxProjectionError, renderedEndpointError, errors: ft.errors };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
})()
