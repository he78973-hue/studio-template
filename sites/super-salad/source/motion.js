/** One timing/easing vocabulary for CSS and WAAPI, including minified CSS units. */
export const motionPreference = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function parseCssTime(value, fallback = 0) {
  const match = value.trim().match(/^(\d+(?:\.\d*)?|\.\d+)(ms|s)$/i);
  if (!match) return fallback;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return fallback;
  return match[2].toLowerCase() === 'ms' ? number : number * 1000;
}

export function readMotion(element = document.documentElement) {
  const style = getComputedStyle(element);
  const duration = (name, fallback) => parseCssTime(style.getPropertyValue(`--motion-${name}`), fallback);
  return {
    reduced: motionPreference?.matches ?? false,
    ease: style.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(0.22, 1, 0.36, 1)',
    press: duration('press', 90), fast: duration('fast', 160), hover: duration('hover', 220),
    content: duration('content', 280), enter: duration('enter', 480), exit: duration('exit', 300),
    receipt: duration('receipt', 360), delay: duration('delay', 80), stagger: duration('stagger', 30),
    offset: Number.parseFloat(style.getPropertyValue('--motion-offset')) || 12,
  };
}

const feedbackAnimations = new Map();
motionPreference?.addEventListener('change', () => {
  if (!motionPreference.matches) return;
  feedbackAnimations.forEach((animation) => animation.cancel());
  feedbackAnimations.clear();
});

function playOnce(element, frames, options) {
  feedbackAnimations.get(element)?.cancel();
  feedbackAnimations.delete(element);
  if (!element.animate || motionPreference?.matches) return null;
  const animation = element.animate(frames, options);
  feedbackAnimations.set(element, animation);
  const clean = () => {
    if (feedbackAnimations.get(element) === animation) feedbackAnimations.delete(element);
  };
  animation.finished.then(clean, clean);
  return animation;
}

export function revealContent(element, direction = 1) {
  const motion = readMotion(element);
  return playOnce(element, [
    { opacity: 0.35, transform: `translateY(${direction * motion.offset}px)` },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: motion.content, easing: motion.ease });
}

export function pulseCount(element) {
  const motion = readMotion(element);
  return playOnce(element, [
    { transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.3 }, { transform: 'scale(1)' },
  ], { duration: motion.hover, easing: motion.ease });
}

export function observeAmbientMotion(hero) {
  const lifetime = new AbortController();
  let onScreen = false;
  const update = () => hero.classList.toggle('ambient-paused', !onScreen || document.hidden || motionPreference.matches);
  const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); });
  observer.observe(hero);
  document.addEventListener('visibilitychange', update, { signal: lifetime.signal });
  motionPreference.addEventListener('change', update, { signal: lifetime.signal });
  update();
  return () => { observer.disconnect(); lifetime.abort(); };
}
