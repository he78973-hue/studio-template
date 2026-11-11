export const CITIES = [
  { id: 'shanghai', name: '上海', region: '上海 · 中国', lat: 31.23, lon: 121.47 },
  { id: 'hangzhou', name: '杭州', region: '浙江 · 中国', lat: 30.27, lon: 120.15 },
  { id: 'beijing', name: '北京', region: '北京 · 中国', lat: 39.90, lon: 116.40 },
  { id: 'shenzhen', name: '深圳', region: '广东 · 中国', lat: 22.54, lon: 114.06 },
  { id: 'chengdu', name: '成都', region: '四川 · 中国', lat: 30.57, lon: 104.07 },
  { id: 'sanya', name: '三亚', region: '海南 · 中国', lat: 18.25, lon: 109.51 },
];
export const numberOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
export const displayNumber = (n, digits = 0) => n == null ? '—' : n.toFixed(digits);
const bounded = (v, lo, hi) => { const n = numberOrNull(v); return n != null && n >= lo && n <= hi ? n : null; };
const WEATHER_CODES = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]);
export function weatherInfo(code, isDay = true) {
  if (!WEATHER_CODES.has(code)) return { kind: 'cloud', label: '天气数据暂缺', icon: 'cloud' };
  if (code === 0) return { kind: isDay ? 'sun' : 'moon', label: isDay ? '晴朗' : '晴夜', icon: isDay ? 'sun' : 'moon' };
  if (code <= 2) return { kind: isDay ? 'partly' : 'cloud', label: code === 1 ? '晴间多云' : '多云', icon: isDay ? 'cloud-sun' : 'cloud' };
  if (code === 3) return { kind: 'cloud', label: '阴天', icon: 'cloud' };
  if (code === 45 || code === 48) return { kind: 'fog', label: '有雾', icon: 'cloud-fog' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { kind: 'snow', label: '降雪', icon: 'cloud-snow' };
  if (code >= 95) return { kind: 'storm', label: '雷阵雨', icon: 'cloud-lightning' };
  if ([51, 53, 55, 56, 57].includes(code)) return { kind: 'rain', label: '毛毛雨', icon: 'cloud-rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { kind: 'rain', label: code === 61 || code === 80 ? '小雨' : '降雨', icon: 'cloud-rain' };
  return { kind: 'cloud', label: '天气变化中', icon: 'cloud' };
}
export function windName(degrees) {
  if (degrees == null) return '风向暂缺';
  return ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'][Math.round(degrees / 45) % 8];
}
export function uvLabel(value) {
  if (value == null) return '数据暂缺';
  return value < 3 ? '低' : value < 6 ? '中等' : value < 8 ? '高' : value < 11 ? '很高' : '极高';
}
export function timeText(epoch, timezone) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(epoch * 1000);
}
export function dateKey(epoch, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(epoch * 1000);
  const pick = type => parts.find(p => p.type === type).value;
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}
export function shortDate(epoch, timezone, weekday = false) {
  const date = new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, month: 'long', day: 'numeric' }).format(epoch * 1000);
  return weekday ? `${date} · ${new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, weekday: 'short' }).format(epoch * 1000)}` : date;
}
export function fullDate(epoch, timezone) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(epoch * 1000);
}
export function forecastURL(city) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  const current = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
  const hourly = 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_direction_10m,uv_index';
  const daily = 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max';
  Object.entries({ latitude: city.lat, longitude: city.lon, current, hourly, daily, timezone: 'auto', timeformat: 'unixtime', wind_speed_unit: 'ms', forecast_days: 7 }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.href;
}
export function normalizeForecast(raw, city, fetchedAt = Date.now()) {
  if (!raw || !numberOrNull(raw.current?.time) || !Array.isArray(raw.hourly?.time) || !raw.hourly.time.length || !Array.isArray(raw.daily?.time) || !raw.daily.time.length) throw Error('预报数据格式不完整');
  if (typeof raw.timezone !== 'string' || !raw.timezone) throw Error('预报缺少时区');
  new Intl.DateTimeFormat('zh-CN', { timeZone: raw.timezone }).format();
  if (raw.current_units?.temperature_2m !== '°C' || raw.hourly_units?.wind_speed_10m !== 'm/s' || raw.hourly_units?.precipitation !== 'mm') throw Error('预报单位与当前图表不匹配');
  const c = raw.current, h = raw.hourly, d = raw.daily;
  const hourly = h.time.map((time, i) => ({
    time: numberOrNull(time), temperature: numberOrNull(h.temperature_2m?.[i]), humidity: bounded(h.relative_humidity_2m?.[i], 0, 100),
    probability: bounded(h.precipitation_probability?.[i], 0, 100), precipitation: bounded(h.precipitation?.[i], 0, 1000), code: numberOrNull(h.weather_code?.[i]),
    visibility: bounded(h.visibility?.[i], 0, 1000000), wind: bounded(h.wind_speed_10m?.[i], 0, 150), direction: bounded(h.wind_direction_10m?.[i], 0, 360), uv: bounded(h.uv_index?.[i], 0, 100),
  }));
  if (hourly.some((p, i) => p.time == null || (i && p.time <= hourly[i - 1].time))) throw Error('预报时间顺序异常');
  const daily = d.time.map((time, i) => ({
    time: numberOrNull(time), min: numberOrNull(d.temperature_2m_min?.[i]), max: numberOrNull(d.temperature_2m_max?.[i]), code: numberOrNull(d.weather_code?.[i]),
    sunrise: numberOrNull(d.sunrise?.[i]), sunset: numberOrNull(d.sunset?.[i]), uv: bounded(d.uv_index_max?.[i], 0, 100),
    precipitation: bounded(d.precipitation_sum?.[i], 0, 1000), probability: bounded(d.precipitation_probability_max?.[i], 0, 100), wind: bounded(d.wind_speed_10m_max?.[i], 0, 150),
  })).filter(p => p.time != null);
  return { city, timezone: raw.timezone, fetchedAt, hourly, daily, current: {
    time: c.time, temperature: numberOrNull(c.temperature_2m), apparent: numberOrNull(c.apparent_temperature), humidity: bounded(c.relative_humidity_2m, 0, 100),
    code: numberOrNull(c.weather_code), isDay: c.is_day === 1, precipitation: bounded(c.precipitation, 0, 1000),
    wind: bounded(c.wind_speed_10m, 0, 150), direction: bounded(c.wind_direction_10m, 0, 360), gusts: bounded(c.wind_gusts_10m, 0, 150), pressure: numberOrNull(c.pressure_msl),
  } };
}
export const upcomingHours = (data, count = 24) => data.hourly.filter(h => h.time > data.current.time).slice(0, count);
export const dayForTime = (data, time) => data.daily.find(d => dateKey(d.time, data.timezone) === dateKey(time, data.timezone));
export function isDayAt(data, time) { const day = dayForTime(data, time); return day?.sunrise != null && day?.sunset != null ? time >= day.sunrise && time < day.sunset : true; }
export function rainSummary(hours) {
  const next = hours.slice(0, 6), probabilities = next.map(h => h.probability).filter(v => v != null);
  return { maxProbability: probabilities.length && probabilities.length === next.length ? Math.max(...probabilities) : null, total: next.length && next.every(h => h.precipitation != null) ? next.reduce((n, h) => n + h.precipitation, 0) : null };
}
