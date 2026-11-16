import { HOLIDAYS } from './data.js';

const DAY = 86400000;
const iso = date => date.toISOString().slice(0, 10);
export const LEAD_WEEK_OPTIONS = [8, 12, 13, 16, 24, 32, 36, 40, 48];
export const SHELF_WEEK_OPTIONS = [0, 2, 4, 6, 8];
export const DEFAULT_TIMING = Object.freeze({ leadWeeks: 13, shelfWeeks: 4, version: 2 });

export function resolveTiming(stored) {
  if (!stored || !LEAD_WEEK_OPTIONS.includes(stored.leadWeeks) || !SHELF_WEEK_OPTIONS.includes(stored.shelfWeeks)) return { ...DEFAULT_TIMING };
  // Upgrade the previous 24-week default once; retain other saved custom cycles.
  const leadWeeks = stored.version !== DEFAULT_TIMING.version && stored.leadWeeks === 24 ? DEFAULT_TIMING.leadWeeks : stored.leadWeeks;
  return { leadWeeks, shelfWeeks: stored.shelfWeeks, version: DEFAULT_TIMING.version };
}

// Gregorian Easter (Western church calendars in the initial target markets).
export function easterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return `${year}-${String(month).padStart(2, '0')}-${String((h + l - 7 * m + 114) % 31 + 1).padStart(2, '0')}`;
}

export function holidayDate(id, year) {
  if (id === 'easter') return easterDate(year);
  if (id === 'thanksgiving') {
    const first = new Date(Date.UTC(year, 10, 1));
    return `${year}-11-${String(1 + (4 - first.getUTCDay() + 7) % 7 + 21).padStart(2, '0')}`;
  }
  const fixed = { valentine: '02-14', halloween: '10-31', christmas: '12-25' };
  return fixed[id] ? `${year}-${fixed[id]}` : '';
}

export function seasonalSchedule({ anchor, year, market = 'all', leadWeeks = DEFAULT_TIMING.leadWeeks, shelfWeeks = DEFAULT_TIMING.shelfWeeks }) {
  if (!Number.isInteger(leadWeeks) || leadWeeks < 1 || leadWeeks > 52 || !Number.isInteger(shelfWeeks) || shelfWeeks < 0 || shelfWeeks > 12) throw new Error('Invalid seasonal planning window');
  const current = new Date(`${anchor}T00:00:00Z`);
  return ['valentine', 'easter', 'halloween', 'thanksgiving', 'christmas'].filter(id => id !== 'thanksgiving' || ['all', 'US'].includes(market)).map(id => {
    const currentYear = year || current.getUTCFullYear();
    const nextDate = holidayDate(id, currentYear);
    const eventDate = !year && nextDate < anchor ? holidayDate(id, currentYear + 1) : nextDate;
    const shelf = new Date(new Date(`${eventDate}T00:00:00Z`).getTime() - shelfWeeks * 7 * DAY);
    const kickoff = new Date(shelf.getTime() - leadWeeks * 7 * DAY);
    const daysUntilKickoff = Math.round((kickoff - current) / DAY);
    return { id, title: HOLIDAYS[id], eventDate, shelfDate: iso(shelf), kickoffDate: iso(kickoff), daysUntilKickoff, status: daysUntilKickoff < 0 ? '复盘 / 现有款快改' : daysUntilKickoff <= 45 ? '准备启动开发' : '进入灵感储备', marketLabel: id === 'thanksgiving' ? '美国' : '美国 · 英 / 德 / 法' };
  }).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

export function quarterOf(date) {
  return `${date.slice(0, 4)}-Q${Math.ceil(Number(date.slice(5, 7)) / 3)}`;
}
