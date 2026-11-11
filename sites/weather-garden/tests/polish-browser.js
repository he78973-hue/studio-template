// Run after the standard browser checks, in a visible 393px-wide app.
(async () => {
  const debug = window.__weatherDebug, q = s => document.querySelector(s);
  const checks = [], check = (name, pass) => { if (!pass) throw Error(name); checks.push(name); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  q('#returnNow').click();
  window.scrollTo({ top: 0, behavior: 'instant' }); await wait(200);
  const initial = debug.state(), chartTop = q('#hourChart svg').getBoundingClientRect().top;
  if (!initial.error) check('chart reaches first viewport earlier', chartTop < 735);
  const date = epoch => new Intl.DateTimeFormat('zh-CN', { timeZone: initial.timezone, month: 'long', day: 'numeric' }).format(epoch * 1000);
  const crossDay = initial.hours.findIndex(h => date(h.time) !== date(initial.selected.time));
  if (crossDay >= 0) {
    debug.selectHour(crossDay);
    check('selected midnight reading includes its date', q('#hourReadout').textContent.includes(date(initial.hours[crossDay].time)));
  } else debug.selectHour(0);
  if (new Set(initial.hours.map(h => date(h.time))).size > 1) check('calendar boundary visible in plot', !!q('.chart-day-label'));
  const back = q('#returnNow'), rect = back.getBoundingClientRect(), wind = q('#windToggle').getBoundingClientRect();
  check('entire return button receives input', [.2, .5, .8].every(x => [.2, .5, .8].every(y => back.contains(document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y)))));
  check('scene buttons do not overlap', rect.bottom <= wind.top || wind.bottom <= rect.top || rect.right <= wind.left || wind.right <= rect.left);
  check('overview navigation is not labelled as a forced current-day reset', q('.bottom-nav a[href="#today"]').textContent.includes('天气'));
  q('[data-metric="wind"]').click();
  const labels = [...q('#hourChart').querySelectorAll('text.chart-axis[x="22"]')].map(t => t.textContent);
  check('rendered axis labels are unique', new Set(labels).size === labels.length);
  check('no horizontal overflow', document.documentElement.scrollWidth <= innerWidth);
  q('#returnNow').click(); q('[data-metric="temperature"]').click();
  return { passed: checks.length, checks, chartTop, source: debug.state().source };
})()
