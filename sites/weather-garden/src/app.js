import { CITIES, normalizeForecast, upcomingHours, dayForTime, isDayAt, weatherInfo, displayNumber, dateKey, timeText, shortDate, fullDate, rainSummary, forecastURL } from './data.js';
import { icon } from './icons.js';
import { CHART_METRICS, plotModel, hourlyChart, weekRows, windCompass, uvGauge, sunArc, daylightMinutes } from './charts.js';
import { WEATHER_SNAPSHOT } from './snapshot.js';
import { WeatherScene } from './scene.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const cacheKey = city => `qingyu.forecast.v1.${city.id}`;
const storageRead = key => { try { return localStorage.getItem(key); } catch { return null; } };
const storageWrite = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Optional cache, never block the weather view. */ } };
const defaultCity = CITIES.find(c => c.id === storageRead('qingyu.city')) || CITIES[0];
const state = { city: defaultCity, data: null, source: 'empty', loading: false, error: '', metric: 'temperature', hour: -1, wind: false };
let scene = null, controller = null, requestId = 0;
function cachedForecast(city) {
  try {
    const cached = JSON.parse(storageRead(cacheKey(city)) || 'null');
    if (cached?.cityId === city.id && Number.isFinite(cached.fetchedAt)) return { data: normalizeForecast(cached.raw, city, cached.fetchedAt), source: 'cache' };
  } catch { /* Ignore an invalid or outdated cache shape. */ }
  if (city.id === WEATHER_SNAPSHOT.cityId) return { data: normalizeForecast(WEATHER_SNAPSHOT.raw, city, WEATHER_SNAPSHOT.fetchedAt), source: 'snapshot' };
  return { data: null, source: 'empty' };
}
function selectedReading() {
  const data = state.data;
  if (!data) return null;
  const hours = upcomingHours(data), selected = state.hour >= 0 ? hours[state.hour] : null;
  return selected ? { ...selected, isDay: isDayAt(data, selected.time), forecast: true } : { ...data.current, forecast: false };
}
function paintIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); }); }
function statusText() {
  if (!state.data) return state.loading ? '正在获取这座城市的预报…' : '暂时没有可显示的预报';
  const data = state.data, stamp = `${state.source === 'live' ? shortDate(data.current.time, data.timezone) : fullDate(data.current.time, data.timezone)} ${timeText(data.current.time, data.timezone)}`;
  const tag = { live: '最新获取', stale: '较早预报', cache: '上次缓存', snapshot: '历史快照' }[state.source];
  return `${tag} · ${stamp}${state.loading ? ' · 更新中' : ''}`;
}
function renderHero() {
  const data = state.data, reading = selectedReading(), forecast = reading?.forecast;
  $('#cityName').textContent = state.city.name;
  $('#dateLabel').textContent = data ? shortDate(data.current.time, data.timezone, true) : '等待这座城市的天气';
  $('#temperature').textContent = displayNumber(reading?.temperature ?? null);
  $('.temperature').setAttribute('aria-label', reading?.temperature == null ? '温度暂缺' : `${displayNumber(reading.temperature)}摄氏度`);
  const info = weatherInfo(reading?.code, reading?.isDay);
  if (!scene) $('#sceneFallback [data-icon]').innerHTML = icon(info.icon, 72);
  $('#conditionName').textContent = data ? info.label : state.loading ? '连接天空中' : '暂无预报';
  $('#periodLabel').textContent = forecast ? `${shortDate(reading.time, data.timezone)} ${timeText(reading.time, data.timezone)} 预报` : state.source === 'snapshot' ? '快照时刻' : state.source === 'cache' || state.source === 'stale' ? '上次预报时刻' : '当前天气';
  const day = data && reading ? dayForTime(data, reading.time) : null;
  $('#highLow').textContent = `最高 ${displayNumber(day?.max ?? null)}° · 最低 ${displayNumber(day?.min ?? null)}°`;
  $('#returnNow').hidden = !forecast;
  const first = forecast ? { label: '降水概率', value: displayNumber(reading.probability), unit: '%', glyph: 'droplets' } : { label: '体感温度', value: displayNumber(reading?.apparent ?? null), unit: '°', glyph: 'thermometer' };
  const metrics = [first, { label: '湿度', value: displayNumber(reading?.humidity ?? null), unit: '%', glyph: 'droplets' }, { label: '风速', value: displayNumber(reading?.wind ?? null, 1), unit: 'm/s', glyph: 'wind' }];
  $('#quickMetrics').innerHTML = metrics.map(m => `<div class="quick-metric"><span>${icon(m.glyph, 14)}${m.label}</span><strong>${m.value}<small>${m.unit}</small></strong></div>`).join('');
  const hours = data ? upcomingHours(data) : [], rain = rainSummary(hours);
  $('#rainInsight').textContent = rain.maxProbability == null ? '未来时段的降水概率暂缺' : `未来 ${Math.min(6, hours.length)} 小时，降水概率最高 ${displayNumber(rain.maxProbability)}%`;
  $('#sourceStatus').dataset.source = state.source;
  $('#statusText').textContent = statusText();
  $('#errorMessage').hidden = !state.error; $('#errorText').textContent = state.error;
  $('#refreshButton').disabled = state.loading; $('#refreshButton').classList.toggle('is-loading', state.loading);
  $('#refreshButton').setAttribute('aria-label', state.loading ? '正在刷新天气' : '刷新天气');
  const windUnavailable = !scene || !Number.isFinite(reading?.wind) || !Number.isFinite(reading?.direction);
  $('#windToggle').disabled = windUnavailable;
  $('#windToggle').title = windUnavailable ? '当前没有可用的3D风向数据' : '风向与风速驱动的动画示意';
  if (scene) scene.setWeather(info.kind, reading || { wind: null, direction: null });
  const currentHour = data?.hourly.filter(h => h.time <= data.current.time).at(-1);
  const uv = forecast ? reading.uv : currentHour?.uv;
  $('#windVisual').innerHTML = windCompass(reading, forecast ? null : reading?.gusts);
  $('#uvVisual').innerHTML = uvGauge(uv ?? null, day?.uv ?? null);
  $('#sunVisual').innerHTML = day && reading ? sunArc(day, reading.time, data.timezone) : '<div class="empty-chart">日出日落数据暂缺</div>';
  const daylight = daylightMinutes(day);
  const readingPeriod = reading && data ? `${forecast ? '所选预报' : '预报时段'} · ${fullDate(reading.time, data.timezone)} ${timeText(reading.time, data.timezone)}` : '预报时段暂缺';
  $('#detailPeriod').textContent = readingPeriod;
  $('#solarPeriod').textContent = readingPeriod;
  $('#daylightLabel').textContent = daylight == null ? '白昼 —' : `白昼 ${Math.floor(daylight / 60)}h ${daylight % 60}m`;
  $('#dataTimestamp').textContent = data ? `预报时刻 ${fullDate(data.current.time, data.timezone)} ${timeText(data.current.time, data.timezone)} · ${data.timezone}\n获取于 ${fullDate(data.fetchedAt / 1000, data.timezone)} ${timeText(data.fetchedAt / 1000, data.timezone)}` : '当前城市暂无可用数据';
}
function renderHourly() {
  const data = state.data, hours = data ? upcomingHours(data) : [], config = CHART_METRICS[state.metric];
  const dated = data && (state.source === 'snapshot' || Math.abs(Date.now() / 1000 - data.current.time) > 10800);
  $('#hourlyTitle').textContent = hours.length ? `${dated ? '该预报后' : '未来'} ${hours.length} 小时` : '未来 24 小时';
  $$('.metric-tabs button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.metric === state.metric)));
  $('#chartKey').innerHTML = `<i style="background:${config.color}"></i>${config.name} · ${config.unit}`;
  const firstDate = hours.length && dateKey(hours[0].time, data.timezone) !== dateKey(data.current.time, data.timezone) ? shortDate(hours[0].time, data.timezone) + ' ' : '';
  $('#chartRange').textContent = hours.length ? `${firstDate}${timeText(hours[0].time, data.timezone)} 起` : '暂无数据';
  $('#hourChart').innerHTML = hourlyChart(hours, state.metric, state.hour, data?.timezone);
  $('#hourRange').disabled = !hours.length; $('#hourRange').max = String(Math.max(0, hours.length - 1)); $('#hourRange').value = String(Math.max(0, state.hour));
  const selected = state.hour >= 0 ? hours[state.hour] : null;
  const selectedDate = selected && dateKey(selected.time, data.timezone) !== dateKey(data.current.time, data.timezone) ? shortDate(selected.time, data.timezone) + ' ' : '';
  $('#hourReadout').innerHTML = selected ? `<b>${selectedDate}${timeText(selected.time, data.timezone)}</b><span>${displayNumber(selected.temperature)}°C</span><span>· 雨 ${displayNumber(selected.probability)}%</span><span>· 风 ${displayNumber(selected.wind, 1)} m/s</span>` : hours.length ? '滑动时间轴，看看下一小时的天空。' : '逐小时预报暂不可用';
  $('#hourRange').setAttribute('aria-valuetext', selected ? `${shortDate(selected.time, data.timezone)} ${timeText(selected.time, data.timezone)}，${config.name}${displayNumber(selected[state.metric], config.digits)}${config.unit}` : '尚未选择预报小时');
  const metricNote = state.metric === 'precipitation' ? '柱形为截至该时刻前一小时的降水量；概率显示在选中读数中。' : state.metric === 'wind' ? '单位 m/s；小箭头表示风的来向，动画流向为相反方向。' : '点选曲线或滑动时间轴，天气积木会一起变化。';
  $('#metricNote').textContent = metricNote + (selected ? ' 点底部「天气」查看所选时段的天空。' : '');
  $('#hourAccessible').innerHTML = hours.length ? `<table><caption>逐小时${config.name}，单位${config.unit}；${statusText()}</caption><thead><tr><th>预报时刻</th><th>${config.name}</th></tr></thead><tbody>${hours.map(h => `<tr><td>${shortDate(h.time, data.timezone)} ${timeText(h.time, data.timezone)}</td><td>${displayNumber(h[state.metric], config.digits)}</td></tr>`).join('')}</tbody></table>` : '';
}
function render() {
  if (state.data && state.hour >= upcomingHours(state.data).length) state.hour = -1;
  renderHero(); renderHourly();
  $('#weekRows').innerHTML = state.data ? weekRows(state.data) : '<div class="empty-chart">七日预报暂不可用</div>';
}
async function refresh(city = state.city) {
  const id = ++requestId;
  controller?.abort(); controller = new AbortController();
  const signal = controller.signal;
  if (state.city.id !== city.id || !state.data) {
    state.city = city; Object.assign(state, cachedForecast(city)); state.hour = -1;
  }
  state.loading = true; state.error = ''; render();
  const timeout = setTimeout(() => controller?.signal === signal && controller.abort(), 12000);
  try {
    const response = await fetch(forecastURL(city), { signal, cache: 'no-store' });
    if (!response.ok) throw Error('天气服务暂时繁忙');
    const raw = await response.json(), fetchedAt = Date.now();
    const data = normalizeForecast(raw, city, fetchedAt);
    if (id !== requestId) return;
    const selectedTime = state.hour >= 0 ? selectedReading()?.time : null;
    state.data = data;
    if (selectedTime != null) state.hour = upcomingHours(data).findIndex(h => h.time === selectedTime);
    state.source = Math.abs(fetchedAt / 1000 - data.current.time) > 10800 ? 'stale' : 'live';
    state.error = state.source === 'stale' ? '接口返回的预报时刻较早，请留意时间。' : '';
    storageWrite(cacheKey(city), JSON.stringify({ cityId: city.id, fetchedAt, raw }));
    storageWrite('qingyu.city', city.id);
  } catch (error) {
    if (id !== requestId) return;
    if (state.source === 'live') state.source = 'cache';
    const reason = !navigator.onLine ? '网络已断开' : error.name === 'AbortError' ? '这次连接有点慢' : '暂时连不上天气服务';
    state.error = `${reason}。${state.data ? '保留有日期的上次数据，稍后再试。' : '当前城市暂无缓存，请重试或换个城市。'}`;
  } finally {
    clearTimeout(timeout);
    if (id === requestId) { state.loading = false; render(); }
  }
}
function selectHour(index) {
  if (!state.data) return;
  const hours = upcomingHours(state.data);
  if (!hours.length) return;
  state.hour = Math.max(0, Math.min(hours.length - 1, Math.round(index)));
  renderHero(); renderHourly();
}
function renderCities(query = '') {
  const cities = CITIES.filter(city => `${city.name}${city.region}`.includes(query.trim()));
  $('#cityList').innerHTML = cities.length ? cities.map(city => `<button class="city-option" data-city="${city.id}" aria-label="查看${city.name}天气">${icon('map-pin', 20)}<span><strong>${city.name}</strong><small>${city.region}</small></span>${city.id === state.city.id ? icon('check', 19) : icon('chevron-right', 17)}</button>`).join('') : '<div class="empty-chart">暂未收录这座城市，请选择列表中的城市。</div>';
}
function openCities() {
  $('#citySearch').value = ''; renderCities();
  if (!$('#cityDialog').open) $('#cityDialog').showModal();
}
function showDay(index) {
  const day = state.data?.daily[index]; if (!day) return;
  const info = weatherInfo(day.code), tz = state.data.timezone;
  $('#dayTitle').textContent = shortDate(day.time, tz, true);
  const items = [
    ['预报降水量', displayNumber(day.precipitation, 1), 'mm'], ['降水概率最高', displayNumber(day.probability), '%'],
    ['最高风速', displayNumber(day.wind, 1), 'm/s'], ['紫外线最高', displayNumber(day.uv, 1), 'UVI'],
    ['日出', day.sunrise == null ? '—' : timeText(day.sunrise, tz), ''], ['日落', day.sunset == null ? '—' : timeText(day.sunset, tz), ''],
  ];
  $('#dayDetails').innerHTML = `<div class="day-detail-summary">${icon(info.icon, 60)}<div><strong>${displayNumber(day.min)}° — ${displayNumber(day.max)}°</strong><p>${info.label} · ${state.city.name}</p></div></div><dl class="day-detail-list">${items.map(([name, value, unit]) => `<div><dt>${name}</dt><dd>${value}<small> ${unit}</small></dd></div>`).join('')}</dl><p class="chart-note">${statusText()}<br>来自地点模型预报，不代表灾害预警。</p>`;
  if (!$('#dayDialog').open) $('#dayDialog').showModal();
}
paintIcons();
Object.assign(state, cachedForecast(defaultCity));
try {
  scene = new WeatherScene($('#weatherCanvas'), { gray: new URLSearchParams(location.search).get('qa') === 'clay' });
} catch {
  $('#weatherCanvas').hidden = true; $('#sceneFallback').hidden = false;
  $('#sceneHint').hidden = true; $('#windToggle').disabled = true; $('#resetScene').disabled = true;
}
$('#cityButton').addEventListener('click', openCities); $('#navCities').addEventListener('click', openCities);
$('#citySearch').addEventListener('input', event => renderCities(event.target.value));
$('#cityList').addEventListener('click', event => {
  const button = event.target.closest('[data-city]'); if (!button) return;
  const city = CITIES.find(c => c.id === button.dataset.city); if (!city) return;
  $('#cityDialog').close(); if (city.id !== state.city.id) refresh(city);
});
$$('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientY < r.top || event.clientY > r.bottom || event.clientX < r.left || event.clientX > r.right) dialog.close(); } }));
$('#refreshButton').addEventListener('click', () => refresh()); $('#retryButton').addEventListener('click', () => refresh());
$('#rainInsightButton').addEventListener('click', () => { state.metric = 'precipitation'; renderHourly(); $('#hourly').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
$('#returnNow').addEventListener('click', () => { state.hour = -1; render(); });
$$('[data-metric]').forEach(button => button.addEventListener('click', () => { state.metric = button.dataset.metric; renderHourly(); }));
$('#hourRange').addEventListener('input', event => selectHour(Number(event.target.value)));
$('#hourChart').addEventListener('click', event => {
  const plot = event.target.closest('[data-hour-plot]'); if (!plot || !state.data) return;
  const box = plot.getBoundingClientRect(), x = (event.clientX - box.left) / box.width * 360;
  selectHour((x - 29) / 312 * (upcomingHours(state.data).length - 1));
});
$('#weekRows').addEventListener('click', event => { const row = event.target.closest('[data-day]'); if (row) showDay(Number(row.dataset.day)); });
$('#windToggle').addEventListener('click', () => { state.wind = !state.wind; $('#windToggle').setAttribute('aria-pressed', String(state.wind)); scene?.setWind(state.wind); $('#sceneHint').lastChild.textContent = state.wind ? ' 风向与风速驱动的动画示意' : '拨动这片天空，松手回正'; });
$('#resetScene').addEventListener('click', () => scene?.reset());
window.addEventListener('online', () => { if (state.error && !state.loading) refresh(); });
window.addEventListener('offline', () => { if (state.source === 'live') state.source = 'cache'; state.error = '网络已断开，当前显示带时间的上次数据。'; render(); });
const navigationObserver = new IntersectionObserver(entries => {
  const visible = entries.find(e => e.isIntersecting); if (!visible) return;
  $$('.bottom-nav a').forEach(a => { if (a.hash === '#' + visible.target.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
}, { rootMargin: '-8% 0px -48% 0px' });
navigationObserver.observe($('#today')); navigationObserver.observe($('#hourly'));
window.__weatherDebug = {
  state: () => ({ city: state.city.id, source: state.source, loading: state.loading, error: state.error, metric: state.metric, hour: state.hour, selected: selectedReading(), hours: state.data ? upcomingHours(state.data) : [], daily: state.data?.daily, timezone: state.data?.timezone }),
  selectHour, scene: () => scene, refresh: () => refresh(),
};
render(); refresh();
