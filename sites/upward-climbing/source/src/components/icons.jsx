import {
  ArrowUpRight, ArrowDown, ArrowUp, MapPin, Clock3, Menu, X,
  Plus, Minus, Check, CalendarDays, Coffee, ShowerHead,
  LockKeyhole, Footprints, Ticket, Info, RefreshCw, Asterisk,
  CircleAlert, LoaderCircle,
} from 'lucide-react';

// Lucide / ISC License. Only this registry imports functional icon glyphs.
export const GLYPHS = Object.freeze({
  'arrow-up-right': ArrowUpRight,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  location: MapPin,
  time: Clock3,
  menu: Menu,
  close: X,
  expand: Plus,
  collapse: Minus,
  check: Check,
  calendar: CalendarDays,
  coffee: Coffee,
  shower: ShowerHead,
  locker: LockKeyhole,
  footprints: Footprints,
  ticket: Ticket,
  info: Info,
  refresh: RefreshCw,
  asterisk: Asterisk,
  alert: CircleAlert,
  loading: LoaderCircle,
});

/**
 * @param {{name: keyof typeof GLYPHS, size?: 'xs'|'sm'|'md'|'lg'|'xl', className?: string}} props
 * Size and color come from CSS tokens. Labels belong to the parent control.
 */
export function Icon({ name, size = 'sm', className = '' }) {
  const Glyph = GLYPHS[name];
  if (!Glyph) throw new Error(`Unknown UPWARD icon: ${name}`);
  return (
    <Glyph
      className={`ui-icon ui-icon--${size} ${className}`}
      data-icon={name}
      strokeWidth={2}
      color="currentColor"
      aria-hidden="true"
      focusable="false"
    />
  );
}
