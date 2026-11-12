import { SHOE_RENTAL_PRICE } from './venue.js';

export const STORAGE_KEY = 'upward-demo-bookings-v1';
export const TIME_ZONE = 'Asia/Shanghai';

export const sessions = [
  { id: 'morning-boulder', time: '10:00', end: '13:00', title: '早鸟自由攀', category: 'boulder', label: '抱石自由攀', level: 'V0–V6 · 自主练习', area: 'A 区 · 抱石空间', coach: '场内教练巡场', price: 98, capacity: 20, remaining: 14, equipment: `攀岩鞋可自备或租赁（¥${SHOE_RENTAL_PRICE}/双/次）；镁粉供应及粉袋规则请提前确认。袜子请自备，运动胶布建议自备。`, requirement: '适合已完成入场安全教学的岩友；首次到馆请提前 20 分钟。' },
  { id: 'first-climb-am', time: '11:00', end: '12:30', title: '人生第一攀', category: 'intro', label: '新手体验', level: '零基础 · 6 人小班', area: 'C 区 · 新手教学区', coach: '阿岩 · 入门教练', price: 168, capacity: 6, remaining: 4, equipment: '已含攀岩鞋、镁粉及 90 分钟教练指导。', requirement: '适合 16 岁及以上的初次体验者。穿舒适运动服，提前 20 分钟到馆。' },
  { id: 'afternoon-boulder', time: '14:00', end: '17:00', title: '午后，刷条线', category: 'boulder', label: '抱石自由攀', level: 'V0–V8 · 自主练习', area: 'A 区 · 抱石空间', coach: '场内教练巡场', price: 98, capacity: 20, remaining: 12, equipment: `攀岩鞋可自备或租赁（¥${SHOE_RENTAL_PRICE}/双/次）；镁粉供应及粉袋规则请提前确认。袜子请自备，运动胶布建议自备。`, requirement: '依颜色选择同一条路线；落地区请保持畅通。首次到馆含入场安全教学。' },
  { id: 'rope-class', time: '16:00', end: '17:30', title: '换个高度看世界', category: 'rope', label: '绳攀体验', level: '5.6–5.10 · 教练保护', area: 'B 区 · 高墙绳攀区', coach: '小夏 · 绳攀教练', price: 198, capacity: 8, remaining: 5, equipment: '已含攀岩鞋、安全带和教练保护。', requirement: '适合 16 岁及以上体验者；上墙前由教练检查装备并讲解保护口令。' },
  { id: 'first-climb-pm', time: '19:00', end: '20:30', title: '下班后，向上走', category: 'intro', label: '新手体验', level: '零基础 · 6 人小班', area: 'C 区 · 新手教学区', coach: '阿岩 · 入门教练', price: 168, capacity: 6, remaining: 2, equipment: '已含攀岩鞋、镁粉及 90 分钟教练指导。', requirement: '无需运动基础，也无需搭档。带上运动服和水，提前 20 分钟到馆。' },
  { id: 'beta-workshop', time: '20:00', end: '21:30', title: 'BETA 动作研习室', category: 'boulder', label: '抱石进阶课', level: 'V3–V5 · 6 人小班', area: 'A 区 · 进阶训练墙', coach: '阿岩 · 技术指导', price: 218, capacity: 6, remaining: 0, equipment: '请自备合脚的攀岩鞋；课程含动作录像复盘。', requirement: '建议已有 V2 稳定完攀能力。练习重心转移、旗式与动态协调。' },
];

export function getSessionDuration(session) {
  const minutes = time => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  };
  return minutes(session.end) - minutes(session.time);
}

export function getSessionPeriod(session) {
  const hour = Number(session.time.split(':')[0]);
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

export function filterSessions({ date, category = 'all', period = 'all', onlyAvailable = false, bookings = [], now = new Date() }) {
  return sessions.filter(session =>
    (category === 'all' || session.category === category) &&
    (period === 'all' || getSessionPeriod(session) === period) &&
    (!onlyAvailable || (!isPastSession(date, session, now) && seatsAvailable(date, session, bookings) > 0))
  );
}

export function todayInShanghai(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function getBookingDays(now = new Date()) {
  const start = todayInShanghai(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${start}T12:00:00+08:00`);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      key: todayInShanghai(date),
      day: Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, day: 'numeric' }).format(date)),
      month: Number(new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'numeric' }).format(date)),
      label: index === 0 ? '今天' : index === 1 ? '明天' : new Intl.DateTimeFormat('zh-CN', { timeZone: TIME_ZONE, weekday: 'short' }).format(date),
    };
  });
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: TIME_ZONE, month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T12:00:00+08:00`));
}

export function isPastSession(date, session, now = new Date()) {
  return new Date(`${date}T${session.time}:00+08:00`) <= now;
}

export function seatsAvailable(date, session, bookings = []) {
  const reserved = bookings.filter(b => b.date === date && b.sessionId === session.id).reduce((sum, b) => sum + b.people, 0);
  return Math.max(0, session.remaining - reserved);
}

export function loadBookings(storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    const data = JSON.parse(store.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(b => {
      if (!b || typeof b.id !== 'string' || typeof b.name !== 'string') return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return false;
      const parsed = new Date(`${b.date}T12:00:00+08:00`);
      if (!Number.isFinite(parsed.getTime()) || todayInShanghai(parsed) !== b.date) return false;
      const session = sessions.find(s => s.id === b.sessionId);
      return session && Number.isInteger(b.people) && b.people > 0 && b.people <= 6 && b.total === session.price * b.people;
    });
  } catch {
    return [];
  }
}

export function validateBooking({ name, phone, people, agreed }, available) {
  if (!name.trim()) return '请填写你的称呼。';
  if (!/^1[3-9]\d{9}$/.test(phone.trim())) return '请填写有效的 11 位中国大陆手机号。';
  if (!Number.isInteger(Number(people)) || Number(people) < 1 || Number(people) > available) return '所选人数超出余位，请重新选择。';
  if (!agreed) return '请先阅读并勾选体验须知。';
  return '';
}
