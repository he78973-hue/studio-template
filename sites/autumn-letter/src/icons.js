import {
  createElement, Play, Pause, RotateCcw, Volume1, Volume2, VolumeX,
  Hand, Mouse, ZoomIn, KeyRound, Music2, LoaderCircle, CircleAlert,
} from 'lucide';

// Lucide / ISC. One 24px master, editorial 1:16 stroke ratio, no per-use overrides.
export const ICONS = Object.freeze({
  play: Play,
  pause: Pause,
  reset: RotateCcw,
  'volume-low': Volume1,
  'volume-high': Volume2,
  'volume-muted': VolumeX,
  drag: Hand,
  scroll: Mouse,
  zoom: ZoomIn,
  wind: KeyRound,
  music: Music2,
  loading: LoaderCircle,
  warning: CircleAlert,
});

/** @typedef {keyof typeof ICONS} IconName */
export const ICON_NAMES = Object.freeze(Object.keys(ICONS));
export const ICON_STROKE = 1.5;

/** Create a decorative SVG. The enclosing control owns the accessible name. */
export function createIcon(name, size = 16) {
  const glyph = ICONS[name];
  if (!glyph) throw new Error(`Unknown UI icon: ${name}`);
  const [tag, attributes, children] = glyph;
  return createElement([tag, {
    ...attributes,
    width: size,
    height: size,
    'stroke-width': ICON_STROKE,
    'aria-hidden': 'true',
    focusable: 'false',
    class: 'ui-icon',
    'data-glyph': name,
  }, children]);
}

/** Replace one glyph, never rescan/recreate unrelated controls. */
export function setIcon(slot, name, size = Number(slot.dataset.iconSize) || 16) {
  if (slot.dataset.renderedIcon === name && slot.dataset.renderedSize === String(size)) return;
  slot.dataset.icon = name;
  slot.dataset.renderedIcon = name;
  slot.dataset.renderedSize = String(size);
  slot.setAttribute('aria-hidden', 'true');
  slot.replaceChildren(createIcon(name, size));
}

export function mountIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(slot => setIcon(slot, slot.dataset.icon));
}
