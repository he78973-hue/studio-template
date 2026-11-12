// UPWARD demo policies. Competitor screenshots are reference evidence, not venue facts.
export const SHOE_RENTAL_PRICE = 20;

export const ticketOptions = [
  { sessionId: 'morning-boulder', title: '自由攀单次票', includes: ['抱石区自主攀爬'], note: '租鞋另计；镁粉供应请提前确认。' },
  { sessionId: 'first-climb-am', title: '新手体验课', includes: ['攀岩鞋、镁粉', '6 人小班教练指导'], note: '16 岁及以上；零基础友好。' },
  { sessionId: 'rope-class', title: '绳攀体验课', includes: ['攀岩鞋、安全带', '教练保护'], note: '16 岁及以上；上墙前检查装备。' },
  { sessionId: 'beta-workshop', title: '抱石进阶课', includes: ['教练动作指导', '动作录像复盘'], note: '攀岩鞋请自备；建议有 V2 基础。' },
];

export const equipmentItems = [
  {
    name: '攀岩鞋', status: '可租／体验课含', tone: 'included',
    detail: `自由攀可自备或租赁，示例租金 ¥${SHOE_RENTAL_PRICE}/双/次；新手、绳攀体验课包含攀岩鞋，进阶课请自备。`,
  },
  {
    name: '镁粉', status: '新手体验包含', tone: 'included',
    detail: '新手体验课已含镁粉；其他场次的供应方式，以及公用镁粉、粉袋使用规则，请到馆前确认。',
  },
  {
    name: '运动胶布', status: '建议自备', tone: 'bring',
    detail: '按个人习惯准备运动胶布；现场是否提供或售卖、如何收费，需到馆前确认。',
  },
  {
    name: '袜子', status: '请自备', tone: 'bring',
    detail: '建议带一双干净袜子，方便换鞋体验；现场是否售卖尚未确认。',
  },
];
