/** Short, interruptible interface motion. The painted scene owns its own timing. */
export function createInterfaceMotion(root, { reduced = false } = {}) {
  const styles = getComputedStyle(root);
  const duration = (name, fallback) => {
    const value=styles.getPropertyValue(name).trim(),number=parseFloat(value);
    // Production CSS may shorten 300ms to .3s; WAAPI always expects milliseconds.
    return Number.isFinite(number)?Math.max(0,number*(value.endsWith('ms')?1:1000)):fallback;
  };
  const curve = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const tokens = {
    content: duration('--duration-content', 180),
    modal: duration('--duration-modal', 300),
    exit: duration('--duration-exit', 180),
    indicator: duration('--duration-indicator', 220),
    enter: curve('--ease-enter', 'cubic-bezier(0,0,.2,1)'),
    leave: curve('--ease-exit', 'cubic-bezier(.4,0,1,1)'),
    move: curve('--ease-move', 'cubic-bezier(.65,0,.35,1)'),
  };
  const running = new Map();
  const dialogs = new Map();
  const visibility = new WeakMap();
  const indicators = new WeakMap();
  const lifecycle = new AbortController();
  let disposed = false;

  function cancel(element) {
    const record = running.get(element);
    if (!record) return;
    running.delete(element);
    clearTimeout(record.timer);
    record.animation.cancel();
  }

  function play(element, keyframes, options = {}, after) {
    cancel(element);
    if (disposed) return;
    if (reduced || document.hidden || !element.animate) { after?.(); return; }
    const settings = {
      duration: tokens.content, easing: tokens.enter, fill: 'both', ...options,
    };
    const animation = element.animate(keyframes, settings);
    if(document.timeline.currentTime!==null)animation.startTime=document.timeline.currentTime;
    const record = { animation, timer:null, complete() {
      if (running.get(element) !== record) return;
      running.delete(element);
      clearTimeout(record.timer);
      after?.();
      animation.cancel();
    } };
    running.set(element, record);
    animation.onfinish = record.complete;
    // Backgrounded tabs / a stalled compositor must not trap a closing modal.
    record.timer=setTimeout(record.complete,Number(settings.duration)+50);
  }

  function reveal(element, distance = 4) {
    const current = running.has(element) ? getComputedStyle(element) : null;
    play(element, [
      { opacity: current?.opacity ?? .6, transform: current?.transform ?? `translateY(${distance}px)` },
      { opacity: 1, transform: 'none' },
    ]);
  }

  function showAnchor(anchor, show) {
    if (visibility.get(anchor) === show) return;
    visibility.set(anchor, show);
    const button = anchor.querySelector('button');
    if(!show && anchor.hidden){anchor.inert=true;button.hidden=true;return;}
    const opacity = anchor.hidden ? 0 : getComputedStyle(button).opacity;
    if(!show && document.activeElement===button)root.querySelector('[data-chapter][aria-current="step"]')?.focus({preventScroll:true});
    anchor.inert = !show;
    anchor.setAttribute('aria-hidden', String(!show));
    if (show) { anchor.hidden = false; button.hidden = false; }
    play(button, [{ opacity }, { opacity: show ? 1 : 0 }], {
      duration: show ? tokens.content : tokens.exit,
      easing: show ? tokens.enter : tokens.leave,
    }, () => {
      if (!visibility.get(anchor)) { anchor.hidden = true; button.hidden = true; }
    });
  }

  function attachDialog(dialog, onChange) {
    const record = { phase: 'closed', opener: null };
    dialogs.set(dialog, record);
    const phase = value => { record.phase = value; dialog.dataset.phase = value; };

    function open(opener = document.activeElement) {
      if (disposed || record.phase === 'open' || record.phase === 'opening') return;
      const current = dialog.open ? getComputedStyle(dialog) : null;
      const start = { opacity: current?.opacity ?? 0, transform: current?.transform ?? 'translateY(8px) scale(.992)' };
      cancel(dialog);
      if (!dialog.open) { record.opener = opener; dialog.showModal(); }
      phase('opening');
      onChange?.(true);
      play(dialog, [start, { opacity: 1, transform: 'none' }], { duration: tokens.modal }, () => phase('open'));
    }

    function close() {
      if (!dialog.open || record.phase === 'closing') return;
      const current = getComputedStyle(dialog);
      const start = { opacity: current.opacity, transform: current.transform };
      phase('closing');
      play(dialog, [start, { opacity: 0, transform: 'translateY(6px)' }], {
        duration: tokens.exit, easing: tokens.leave,
      }, () => { dialog.close(); phase('closed'); onChange?.(false); });
    }

    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, { signal: lifecycle.signal });
    dialog.addEventListener('close', () => {
      // A queued close event may belong to a previous, immediately reopened modal.
      if(dialog.open)return;
      cancel(dialog);
      phase('closed');
      onChange?.(false);
      if (record.opener?.isConnected && !record.opener.closest('[inert]')) record.opener.focus({ preventScroll: true });
      record.opener = null;
    }, { signal: lifecycle.signal });
    return { open, close };
  }

  function moveIndicator(container, selected, animate = true) {
    const indicator = container.querySelector('.tab-indicator');
    if (!indicator || !selected || !container.getClientRects().length) return;
    // Read only on tab/size changes, before writes. Offsets are unaffected by
    // the dialog's temporary entrance transform.
    const left = selected.offsetLeft, width = selected.offsetWidth;
    const transform = `translateX(${left}px) scaleX(${width})`;
    const previous = indicators.get(container);
    const from = running.has(indicator) ? getComputedStyle(indicator).transform : previous;
    indicators.set(container, transform);
    indicator.style.transform = transform;
    if (animate && from && from !== transform) {
      play(indicator, [{ transform: from }, { transform }], { duration: tokens.indicator, easing: tokens.move });
    } else cancel(indicator);
  }

  function setReduced(value) {
    reduced = value;
    root.dataset.motion = value ? 'reduced' : 'full';
    if (value) [...running.values()].forEach(record => record.complete());
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)[...running.values()].forEach(record=>record.complete());
  },{signal:lifecycle.signal});
  setReduced(reduced);

  return {
    reveal, showAnchor, attachDialog, moveIndicator, setReduced,
    inspect: () => ({ reduced, animations: running.size, dialogs: [...dialogs.values()].map(({ phase }) => phase) }),
    dispose() {
      disposed = true;
      lifecycle.abort();
      [...running.keys()].forEach(cancel);
      dialogs.forEach((_, dialog) => { if (dialog.open) dialog.close(); });
      dialogs.clear();
    },
  };
}
