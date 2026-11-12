(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const book = $('book');
  const previous = $('previous');
  const next = $('next');
  const edgePrevious = $('edge-prev');
  const edgeNext = $('edge-next');
  const pages = Array.from(document.querySelectorAll('[data-belongs]'));
  const mobile = window.matchMedia('(max-width: 1099px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['学校与校长', '从观察到设计', '形式与工坊', '从课堂到作品'];
  const leaves = Array.from(book.querySelectorAll('[data-leaf]'));
  const last = names.length - 1;
  function hashIndex() {
    const match = /^#spread-([1-4])$/.exec(location.hash);
    return match ? Number(match[1]) - 1 : 0;
  }
  const model = new window.BookTurn.TurnModel(hashIndex(), last);
  let raf = 0;
  let lastCommitted = -1;
  let recordHistory = false;
  let drag = null;
  let ignoreClickUntil = 0;
  const instant = () => mobile.matches || reduce.matches;
  function cancelFrame() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function releasePointer() {
    const active = drag;
    drag = null;
    if (active && active.edge.hasPointerCapture(active.id)) active.edge.releasePointerCapture(active.id);
    if (active) ignoreClickUntil = performance.now() + 300;
    return active;
  }
  function flush() {
    cancelFrame();
    paint(performance.now());
  }

  function updateControls() {
    const atStart = model.target === 0;
    const atEnd = model.target === last;
    const focused = document.activeElement;
    previous.disabled = edgePrevious.disabled = atStart;
    next.disabled = edgeNext.disabled = atEnd;
    previous.title = atStart ? '已经是第一跨页' : `返回${names[model.target - 1]}`;
    next.title = atEnd ? '已经是最后一组跨页' : `翻到${names[model.target + 1]}`;
    if ((focused === previous || focused === edgePrevious) && atStart) next.focus({ preventScroll: true });
    if ((focused === next || focused === edgeNext) && atEnd) previous.focus({ preventScroll: true });
  }
  function commit() {
    const changed = model.committed !== lastCommitted;
    if (changed) {
      const focused = document.activeElement;
      let hidesFocus = false;
      lastCommitted = model.committed;
      book.dataset.spread = String(model.committed);
      pages.forEach((page) => {
        const inactive = Number(page.dataset.belongs) !== model.committed;
        if (inactive && page.contains(focused)) hidesFocus = true;
        page.inert = inactive;
        page.setAttribute('aria-hidden', String(inactive));
      });
      $('spread-name').textContent = names[model.committed];
      $('spread-number').textContent = `0${model.committed + 1}`;
      $('reader-status').textContent = `第${model.committed + 1}跨页，共${names.length}组：${names[model.committed]}。`;
      if (hidesFocus) (model.committed === 0 ? next : previous).focus({ preventScroll: true });
    }
    if (recordHistory) {
      const hash = `#spread-${model.committed + 1}`;
      if (location.hash !== hash) history.pushState({ spread: model.committed }, '', hash);
    }
    const hint = mobile.matches
      ? '窄屏采用平面阅读；向下滚动查看这一跨页的两页内容。'
      : (model.committed === last ? '已到末页；向下继续旋转作品模型，或使用 ← 键翻回。' : '拖动页缘，或使用 ← → 键逐页阅读。');
    if ($('navigation-hint').textContent !== hint) $('navigation-hint').textContent = hint;
    recordHistory = false;
    updateControls();
  }
  function paint(now) {
    raf = 0;
    model.tick(now);
    leaves.forEach((leaf, i) => {
      const progress = window.BookTurn.clamp(model.progress - i);
      leaf.style.setProperty('--turn', `${-180 * progress}deg`);
      leaf.style.setProperty('--shade', (Math.sin(Math.PI * progress) * .72).toFixed(4));
      leaf.style.setProperty('--leaf-z', String(progress > 0 && progress < 1 ? 8 : progress >= .5 ? 3 + i : 6 - i));
      leaf.classList.toggle('leaf-moving', progress > 0 && progress < 1);
    });
    book.classList.toggle('is-moving', model.moving);
    book.classList.toggle('is-dragging', model.dragging);
    book.setAttribute('aria-busy', String(model.moving));
    if (!model.moving) commit();
    if (model.animation) raf = requestAnimationFrame(paint);
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(paint);
  }
  function navigate(index, record = true) {
    releasePointer();
    cancelFrame();
    recordHistory = record;
    const immediate = instant() || Math.abs(index - model.progress) > 1;
    model.request(index, performance.now(), immediate);
    updateControls();
    if (immediate) {
      flush();
      if (mobile.matches && record) book.scrollIntoView({ block: 'start', behavior: 'auto' });
    } else schedule();
  }
  // Repeated same-direction input keeps the active leaf moving; opposite input reverses it.
  function adjacent(step) {
    return Math.max(0, Math.min(last, step > 0 ? Math.floor(model.progress) + 1 : Math.ceil(model.progress) - 1));
  }
  previous.addEventListener('click', () => navigate(adjacent(-1)));
  next.addEventListener('click', () => navigate(adjacent(1)));

  function bindEdge(edge, step) {
    edge.addEventListener('pointerdown', (event) => {
      if (edge.disabled || event.button !== 0 || instant()) return;
      event.preventDefault();
      releasePointer();
      cancelFrame();
      const now = performance.now();
      const destination = adjacent(step);
      const lower = Math.max(0, step > 0 ? Math.floor(model.progress) : Math.ceil(model.progress) - 1);
      model.beginDrag(now);
      drag = { id: event.pointerId, edge, destination, lower, upper: Math.min(last, lower + 1), x: event.clientX, lastX: event.clientX, lastAt: now, velocity: 0, initial: model.progress, width: book.getBoundingClientRect().width / 2, moved: false };
      edge.setPointerCapture(event.pointerId);
      recordHistory = true;
      schedule();
    });
    edge.addEventListener('pointermove', (event) => {
      if (!drag || drag.edge !== edge || drag.id !== event.pointerId) return;
      const now = performance.now();
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 5) drag.moved = true;
      const dt = now - drag.lastAt;
      if (dt > 0) drag.velocity = -(event.clientX - drag.lastX) / dt / drag.width;
      drag.lastAt = now; drag.lastX = event.clientX;
      if (drag.moved) model.dragTo(Math.max(drag.lower, Math.min(drag.upper, drag.initial - dx / drag.width)));
      schedule();
    });
    edge.addEventListener('pointerup', (event) => {
      if (!drag || drag.edge !== edge || drag.id !== event.pointerId) return;
      const active = releasePointer();
      cancelFrame();
      if (!active.moved) model.request(active.destination, performance.now(), instant());
      else {
        const velocity = performance.now() - active.lastAt > 100 ? 0 : active.velocity;
        const target = Math.abs(velocity) > .0007 ? (velocity > 0 ? active.upper : active.lower) : Math.round(model.progress);
        model.request(target, performance.now(), instant());
      }
      updateControls(); schedule();
    });
    function cancelPointer(event) {
      if (!drag || drag.id !== event.pointerId) return;
      releasePointer(); cancelFrame();
      model.cancel(performance.now(), instant()); updateControls(); schedule();
    }
    edge.addEventListener('pointercancel', cancelPointer);
    edge.addEventListener('lostpointercapture', cancelPointer);
    edge.addEventListener('click', () => {
      if (performance.now() >= ignoreClickUntil) navigate(adjacent(step));
    });
  }
  bindEdge(edgeNext, 1); bindEdge(edgePrevious, -1);

  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),.sources,.objects-chapter')) return;
    if (window.getSelection()?.toString()) return;
    const direction = { ArrowLeft: adjacent(-1), ArrowRight: adjacent(1), Home: 0, End: last }[event.key];
    if (direction === undefined) return;
    event.preventDefault(); navigate(direction);
  });
  window.addEventListener('hashchange', () => {
    if (/^#spread-[1-4]$/.test(location.hash)) navigate(hashIndex(), false);
  });
  window.addEventListener('popstate', () => {
    if (!location.hash || /^#spread-[1-4]$/.test(location.hash)) navigate(hashIndex(), false);
  });
  function settleEnvironment() {
    releasePointer(); cancelFrame();
    model.settle(); flush();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) settleEnvironment();
  });
  function updateEnvironment() {
    releasePointer(); cancelFrame();
    model.settle(); flush();
  }
  mobile.addEventListener('change', updateEnvironment);
  reduce.addEventListener('change', updateEnvironment);

  const study = $('colour-study');
  const swap = $('swap-colours');
  const values = $('show-values');
  function updateExercise() {
    const shown = study.classList.contains('show-values');
    const swapped = study.classList.contains('is-swapped');
    values.setAttribute('aria-pressed', String(shown));
    values.textContent = shown ? '隐藏色值' : '显示色值';
    $('experiment-result').textContent = shown
      ? '两块色值都是 #949A96。变化的是背景，不是色块。'
      : (swapped ? '背景已交换。两块灰色没有改变。' : '试着交换背景，再比较一次。');
  }
  swap.addEventListener('click', () => { study.classList.toggle('is-swapped'); updateExercise(); });
  values.addEventListener('click', () => { study.classList.toggle('show-values'); updateExercise(); });
  document.querySelectorAll('a[href="#sources"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      $('sources').open = true;
      $('sources').scrollIntoView({ block: 'start', behavior: 'auto' });
      $('sources').querySelector('summary').focus({ preventScroll: true });
    });
  });
  document.querySelector('.identity').addEventListener('click', (event) => {
    event.preventDefault(); navigate(0); $('reading').scrollIntoView({ block: 'start', behavior: 'auto' });
  });
  let sourcesBeforePrint = false;
  window.addEventListener('beforeprint', () => {
    settleEnvironment();
    sourcesBeforePrint = $('sources').open;
    $('sources').open = true;
  });
  window.addEventListener('afterprint', () => { $('sources').open = sourcesBeforePrint; });
  window.addEventListener('pagehide', settleEnvironment);
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    releasePointer(); cancelFrame(); recordHistory = false;
    model.request(hashIndex(), performance.now(), true); flush();
  });
  window.BauhausBook = Object.freeze({ getState: () => model.snapshot() });
  document.documentElement.classList.add('js');
  if (window.BookIcons) window.BookIcons.mount(document);
  paint(performance.now());
})();
