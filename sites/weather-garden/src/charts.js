import { icon } from './icons.js';
import { displayNumber, timeText, shortDate, dateKey, weatherInfo, windName, uvLabel } from './data.js';

export const CHART_METRICS = {
  temperature: { name: '气温', unit: '°C', color: '#cc7849', wash: '#f5d9c3', digits: 0 },
  precipitation: { name: '降水量', unit: 'mm', color: '#578dac', wash: '#d6e6f0', digits: 1 },
  wind: { name: '风速', unit: 'm/s', color: '#487e73', wash: '#dcece6', digits: 1 },
};
export function plotModel(hours, metric) {
  const values = hours.map(h => h[metric]).filter(v => v != null);
  let min = 0, max = 1;
  if (values.length && metric === 'temperature') { min = Math.floor(Math.min(...values) - 2); max = Math.ceil(Math.max(...values) + 2); }
  else if (values.length) max = Math.max(metric === 'precipitation' ? 1 : 2, Math.ceil(Math.max(...values) * 1.15));
  const roughStep = (max - min) / 3;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const error = roughStep / power;
  const step = power * (error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  min = Math.floor(min / step) * step; max = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => Number((min + i * step).toFixed(decimals)));
  const x = i => 29 + (i / Math.max(1, hours.length - 1)) * 312;
  const y = v => 139 - ((v - min) / (max - min)) * 111;
  return { min, max, x, y, values, ticks, decimals };
}
function continuousSegments(hours, metric, x, y) {
  const segments = []; let segment = [];
  hours.forEach((h, i) => {
    if (h[metric] == null) { if (segment.length) segments.push(segment); segment = []; }
    else segment.push([x(i), y(h[metric])]);
  });
  if (segment.length) segments.push(segment);
  return segments;
}
export function hourlyChart(hours, metric, selected, timezone) {
  if (!hours.length) return '<div class="empty-chart">逐小时预报暂不可用</div>';
  const config = CHART_METRICS[metric], model = plotModel(hours, metric), { min, max, x, y } = model;
  if (!model.values.length) return '<div class="empty-chart">这个指标的数据暂缺，请试试其他指标。</div>';
  let lines = '', labels = '', marks = '';
  for (const value of model.ticks) {
    const yy = y(value);
    lines += `<line class="chart-grid" x1="29" y1="${yy}" x2="341" y2="${yy}"/>`;
    labels += `<text class="chart-axis" x="22" y="${yy + 3}" text-anchor="end">${displayNumber(value, model.decimals)}</text>`;
  }
  hours.forEach((hour, i) => {
    if (!i || dateKey(hour.time, timezone) === dateKey(hours[i - 1].time, timezone)) return;
    lines += `<line class="chart-day-divider" x1="${x(i)}" y1="25" x2="${x(i)}" y2="144"/>`;
    labels += `<text class="chart-day-label" x="${Math.min(x(i) + 5, 279)}" y="19">${shortDate(hour.time, timezone)}</text>`;
  });
  const ticks = [...new Set([0, Math.round((hours.length - 1) / 4), Math.round((hours.length - 1) / 2), Math.round((hours.length - 1) * .75), hours.length - 1])];
  ticks.forEach(i => { labels += `<text class="chart-axis" x="${x(i)}" y="165" text-anchor="${i === 0 ? 'start' : i === hours.length - 1 ? 'end' : 'middle'}">${timeText(hours[i].time, timezone)}</text>`; });
  if (metric === 'precipitation') {
    const width = Math.min(10, 230 / hours.length);
    hours.forEach((h, i) => {
      if (h.precipitation == null) { marks += `<text class="chart-axis" x="${x(i)}" y="133" text-anchor="middle">–</text>`; return; }
      const yy = y(h.precipitation);
      marks += `<rect x="${x(i) - width / 2}" y="${yy}" width="${width}" height="${139 - yy}" rx="3" fill="${config.color}" opacity="${selected === i ? 1 : .65}"/>`;
    });
    if (model.values.length === hours.length && model.values.every(v => v === 0)) marks += '<text x="187" y="90" text-anchor="middle" class="chart-axis">这些时段的预报降水量为 0 mm</text>';
  } else {
    continuousSegments(hours, metric, x, y).forEach(points => {
      if (points.length === 1) {
        marks += `<circle cx="${points[0][0]}" cy="${points[0][1]}" r="2.5" fill="${config.color}" stroke="white" stroke-width="1.4"/>`;
        return;
      }
      const path = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
      marks += `<path d="${path} L${points.at(-1)[0]},139 L${points[0][0]},139 Z" fill="url(#hour-fill)"/><path class="chart-line" d="${path}" stroke="${config.color}"/>`;
    });
    hours.forEach((h, i) => { if (h[metric] != null && i % 3 === 0) marks += `<circle cx="${x(i)}" cy="${y(h[metric])}" r="2.5" fill="${config.color}" stroke="white" stroke-width="1.4"/>`; });
    if (metric === 'wind') ticks.forEach(i => {
      if (hours[i].direction != null) marks += `<path d="M-3,3 L0,-4 L3,3 M0,-4 V6" transform="translate(${x(i)},148) rotate(${hours[i].direction})" stroke="${config.color}" fill="none" stroke-width="1.3"/>`;
    });
  }
  if (selected >= 0 && hours[selected]) {
    const h = hours[selected], xx = x(selected);
    marks += `<line x1="${xx}" y1="21" x2="${xx}" y2="144" stroke="${config.color}" opacity=".4" stroke-dasharray="3 4"/>`;
    if (h[metric] != null) marks += `<circle cx="${xx}" cy="${y(h[metric])}" r="5" fill="${config.color}" stroke="white" stroke-width="2.5"/>`;
  }
  return `<svg viewBox="0 0 360 180" role="img" aria-label="${hours.length}小时${config.name}，单位${config.unit}" data-hour-plot><defs><linearGradient id="hour-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${config.wash}" stop-opacity=".8"/><stop offset="1" stop-color="${config.wash}" stop-opacity=".05"/></linearGradient></defs>${lines}${marks}${labels}</svg>`;
}
export function weekRows(data) {
  const valid = data.daily.filter(d => d.min != null && d.max != null && d.max >= d.min);
  const min = valid.length ? Math.min(...valid.map(d => d.min)) : 0;
  const max = valid.length ? Math.max(...valid.map(d => d.max)) : 1;
  const span = Math.max(1, max - min);
  const today = data.daily.findIndex(day => dateKey(day.time, data.timezone) === dateKey(Date.now() / 1000, data.timezone));
  return data.daily.slice(0, 7).map((day, i) => {
    const info = weatherInfo(day.code), label = i === today ? '今天' : today >= 0 && i === today + 1 ? '明天' : new Intl.DateTimeFormat('zh-CN', { timeZone: data.timezone, weekday: 'short' }).format(day.time * 1000);
    const hasRange = day.min != null && day.max != null && day.max >= day.min;
    const band = hasRange ? `<span style="left:${(day.min - min) / span * 100}%;width:${(day.max - day.min) / span * 100}%"></span>` : '';
    return `<button class="day-row" data-day="${i}" aria-haspopup="dialog" aria-label="${shortDate(day.time, data.timezone)} ${info.label}，最低${displayNumber(day.min)}度，最高${displayNumber(day.max)}度"><span class="day-label">${label}<small>${new Intl.DateTimeFormat('zh-CN', { timeZone: data.timezone, month: 'numeric', day: 'numeric' }).format(day.time * 1000)}</small></span>${icon(info.icon, 21)}<span class="day-min">${displayNumber(day.min)}°</span><span class="range-track">${band}</span><span class="day-max">${displayNumber(day.max)}°</span>${icon('chevron-right', 12).replace('<svg ', '<svg class="day-chevron" ')}</button>`;
  }).join('');
}
export function windCompass(reading, gusts = null) {
  const direction = reading?.direction, speed = reading?.wind;
  let ticks = '';
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, r = i % 6 === 0 ? 46 : 50;
    ticks += `<line x1="${80 + Math.sin(a) * r}" y1="${78 - Math.cos(a) * r}" x2="${80 + Math.sin(a) * 54}" y2="${78 - Math.cos(a) * 54}" stroke="#b2c9c0" stroke-width="${i % 6 === 0 ? 1.5 : 1}"/>`;
  }
  const needle = direction == null ? '' : `<g transform="rotate(${direction} 80 78)"><path d="M80 30 L86 85 L80 79 L74 85 Z" fill="#40756d"/><path d="M80 126 L75 76 L80 79 L85 76 Z" fill="#b1cdc3"/></g><circle cx="80" cy="78" r="5" fill="#edf4f1" stroke="#40756d" stroke-width="2"/>`;
  return `<svg class="compass" viewBox="0 0 160 156" role="img" aria-label="${windName(direction)}，${displayNumber(speed, 1)}米每秒"><circle cx="80" cy="78" r="55" fill="none" stroke="#d1e1da"/>${ticks}${needle}<g fill="var(--muted)" font-size="10" font-family="sans-serif" text-anchor="middle"><text x="80" y="13">N</text><text x="147" y="82">E</text><text x="80" y="150">S</text><text x="13" y="82">W</text></g></svg><p class="wind-value">${displayNumber(speed, 1)}<small>m/s</small></p><p class="wind-caption">${windName(direction)}${gusts == null ? '' : ` · 阵风 ${displayNumber(gusts, 1)}`}</p>`;
}
function arcPoint(cx, cy, radius, angle) { const a = angle * Math.PI / 180; return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]; }
function arcPath(cx, cy, radius, start, end) {
  const a = arcPoint(cx, cy, radius, start), b = arcPoint(cx, cy, radius, end);
  return `M${a.join(',')} A${radius},${radius} 0 ${end - start > 180 ? 1 : 0},1 ${b.join(',')}`;
}
export function uvGauge(uv, max) {
  const fraction = uv == null ? 0 : Math.min(1, uv / 12), end = 145 + 250 * fraction;
  const point = arcPoint(80, 76, 57, end);
  return `<svg class="uv-gauge" viewBox="0 0 160 140" role="img" aria-label="紫外线指数 ${displayNumber(uv, 1)}，${uvLabel(uv)}"><path d="${arcPath(80, 76, 57, 145, 395)}" fill="none" stroke="#eadac9" stroke-width="8" stroke-linecap="round"/>${uv == null ? '' : `<path d="${arcPath(80, 76, 57, 145, Math.max(145.05, end))}" fill="none" stroke="#cd8b53" stroke-width="8" stroke-linecap="round"/><circle cx="${point[0]}" cy="${point[1]}" r="6" fill="#cd8b53" stroke="#fbf0e5" stroke-width="2.5"/>`}<text x="80" y="89" text-anchor="middle" fill="#805735" font-family="sans-serif" font-weight="500" font-size="34">${displayNumber(uv, 1)}</text><text x="29" y="133" fill="#806e5d" font-size="9">0</text><text x="120" y="133" fill="#806e5d" font-size="9">12+</text></svg><p class="uv-level">${uvLabel(uv)}</p><p class="uv-caption">当日最高 ${displayNumber(max, 1)}</p>`;
}
export function daylightMinutes(day) {
  return day?.sunrise != null && day?.sunset != null && day.sunset > day.sunrise ? Math.round((day.sunset - day.sunrise) / 60) : null;
}
export function sunArc(day, time, timezone) {
  const minutes = daylightMinutes(day);
  if (minutes == null) return '<div class="empty-chart">日出日落数据暂不可用</div>';
  const progress = Math.max(0, Math.min(1, (time - day.sunrise) / (day.sunset - day.sunrise)));
  const a = Math.PI + progress * Math.PI, x = 170 + Math.cos(a) * 142, y = 116 + Math.sin(a) * 76;
  const daylight = time >= day.sunrise && time < day.sunset;
  const caption = daylight ? `${timeText(time, timezone)} · 白昼进程示意` : time < day.sunrise ? '太阳还未升起' : '太阳已经落下';
  return `<svg class="sun-chart" viewBox="0 0 340 140" role="img" aria-label="日出${timeText(day.sunrise, timezone)}，日落${timeText(day.sunset, timezone)}。弧线表示白昼时间进程"><defs><linearGradient id="sun-wash" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4d5b7" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient></defs><path d="M28 116 A142 76 0 0 1 312 116 Z" fill="url(#sun-wash)"/><path d="M28 116 A142 76 0 0 1 312 116" fill="none" stroke="#dfb488" stroke-width="1.5" stroke-dasharray="3 5"/><line x1="15" y1="116" x2="325" y2="116" stroke="#e3eaed"/><circle cx="${x}" cy="${y}" r="13" fill="${daylight ? '#efb275' : '#a7becb'}" stroke="white" stroke-width="4"/><circle cx="28" cy="116" r="3" fill="#cfa177"/><circle cx="312" cy="116" r="3" fill="#cfa177"/></svg><div class="sun-labels"><span>日出<strong>${timeText(day.sunrise, timezone)}</strong></span><span style="text-align:right">日落<strong>${timeText(day.sunset, timezone)}</strong></span></div><p class="sun-caption">${caption}</p>`;
}
