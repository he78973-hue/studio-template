(() => {
  const story = document.getElementById('story');
  const panels = [...story.querySelectorAll('.panel')];
  const timeline = document.getElementById('timeline');
  const previous = document.getElementById('prev');
  const next = document.getElementById('next');
  const count = document.getElementById('chapter-count');
  const announcement = document.getElementById('chapter-announcement');
  const startCue = document.getElementById('start-cue');
  const sourcesButton = document.getElementById('open-sources');
  const sourcesDialog = document.getElementById('sources-dialog');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lastIndex = panels.length - 1;
  let active = -1;
  let scrollFrame = 0;
  let drag = null;
  let wheelAmount = 0;
  let wheelUnlock = 0;
  let wheelReset = 0;

  const markers = panels.map((panel, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeline-button';
    button.textContent = panel.dataset.year;
    button.title = `${panel.dataset.short} · ${panel.dataset.year}`;
    button.setAttribute('aria-label', `前往${panel.dataset.short}，${panel.dataset.year}`);
    button.addEventListener('click', () => goTo(index));
    timeline.appendChild(button);
    return button;
  });

  function setActive(index) {
    index = Math.max(0, Math.min(lastIndex, index));
    if (index === active) return;
    active = index;
    const panel = panels[index];
    panels.forEach((item, i) => item.classList.toggle('is-current', i === index));
    markers.forEach((item, i) => {
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    previous.disabled = index === 0;
    const atEnd = index === lastIndex;
    next.innerHTML = `<span class="icon" aria-hidden="true">${window.StepIcons.icon(atEnd ? 'rotateCcw' : 'arrowRight')}</span>`;
    next.classList.toggle('is-restart', atEnd);
    next.setAttribute('aria-label', atEnd ? '回到开头，再看一次' : '下一章节');
    count.textContent = `${String(index).padStart(2, '0')} / ${String(lastIndex).padStart(2, '0')}`;
    count.classList.remove('is-ticking');
    void count.offsetWidth;
    count.classList.add('is-ticking');
    announcement.textContent = `${panel.dataset.short}，${panel.dataset.year}，第 ${index + 1} 页，共 ${panels.length} 页`;
    document.body.dataset.chapter = panel.id;
    document.documentElement.style.setProperty('--progress', (index / lastIndex).toFixed(4));
    try { history.replaceState(null, '', `#${panel.id}`); } catch (_) { /* file:// may prohibit history writes */ }
    if (window.innerWidth <= 700) {
      const target = markers[index];
      timeline.scrollTo({
        left: target.offsetLeft - timeline.offsetLeft - (timeline.clientWidth - target.clientWidth) / 2,
        behavior: motionQuery.matches ? 'auto' : 'smooth'
      });
    }
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(lastIndex, index));
    const distance = Math.abs(target - active);
    const behavior = motionQuery.matches || distance > 3 ? 'auto' : 'smooth';
    story.scrollTo({ left: target * story.clientWidth, behavior });
    setActive(target);
  }

  function syncPosition() {
    scrollFrame = 0;
    setActive(Math.round(story.scrollLeft / Math.max(1, story.clientWidth)));
  }

  story.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncPosition);
  }, { passive: true });

  story.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.cancelable) event.preventDefault();
    const now = performance.now();
    if (now < wheelUnlock) return;
    wheelAmount += event.deltaY;
    window.clearTimeout(wheelReset);
    wheelReset = window.setTimeout(() => { wheelAmount = 0; }, 220);
    if (Math.abs(wheelAmount) < 40) return;
    const direction = wheelAmount > 0 ? 1 : -1;
    wheelAmount = 0;
    wheelUnlock = now + 720;
    goTo(active + direction);
  }, { passive: false });

  story.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, left: story.scrollLeft, moved: false, id: event.pointerId };
    story.setPointerCapture(event.pointerId);
  });
  story.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 4) {
      if (!drag.moved) story.classList.add('is-dragging');
      drag.moved = true;
      story.scrollLeft = drag.left - distance;
    }
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    story.classList.remove('is-dragging');
    if (moved) goTo(Math.round(story.scrollLeft / story.clientWidth));
  };
  story.addEventListener('pointerup', endDrag);
  story.addEventListener('pointercancel', endDrag);

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (sourcesDialog.open) return;
    const destination = { ArrowRight: active + 1, ArrowLeft: active - 1, PageDown: active + 1, PageUp: active - 1, Home: 0, End: lastIndex }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    goTo(destination);
  });

  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active === lastIndex ? 0 : active + 1));
  startCue.addEventListener('click', () => goTo(1));

  sourcesButton.addEventListener('click', () => {
    document.body.classList.add('is-dialog-open');
    if (typeof sourcesDialog.showModal === 'function') sourcesDialog.showModal();
    else sourcesDialog.setAttribute('open', '');
  });
  sourcesDialog.addEventListener('close', () => {
    document.body.classList.remove('is-dialog-open');
  });
  sourcesDialog.addEventListener('click', (event) => {
    if (event.target === sourcesDialog) sourcesDialog.close();
  });
  document.querySelector('.skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    story.focus();
    goTo(0);
  });
  document.querySelector('.brand').addEventListener('click', (event) => {
    event.preventDefault();
    goTo(0);
  });

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('is-page-hidden', document.hidden);
  });
  window.addEventListener('resize', () => {
    story.scrollLeft = active * story.clientWidth;
    syncPosition();
  });

  const hashIndex = panels.findIndex(panel => `#${panel.id}` === location.hash);
  const initial = hashIndex >= 0 ? hashIndex : 0;
  story.scrollLeft = initial * story.clientWidth;
  setActive(initial);
  document.documentElement.classList.add('js-ready');
})();
