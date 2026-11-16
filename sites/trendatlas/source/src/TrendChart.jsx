import React, { useEffect, useId, useRef, useState } from 'react';
import { BarChart3, ChevronDown, Download } from 'lucide-react';
import { DEMO_DATE } from './data.js';
import { downloadFile, makeCSV } from './csv.js';

export function TrendChart({ trends, days, mode }) {
  const [hidden, setHidden] = useState([]);
  const [active, setActive] = useState(null);
  const [width, setWidth] = useState(720);
  const chartRef = useRef(null);
  const inputId = useId();
  const lines = trends.slice(0, 3);
  const visible = lines.filter(t => !hidden.includes(t.id));
  const hasHistory = mode === 'demo' && lines.length > 0;
  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(280, Math.round(entries[0].contentRect.width))));
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [hasHistory]);
  const count = days === 30 ? 5 : 13;
  const selected = Math.min(count - 1, active ?? count - 1);
  const height = 210, left = 32, right = 22, top = 14, bottom = 30;
  const x = i => left + i / (count - 1) * (width - left - right);
  const y = value => top + (100 - value) / 100 * (height - top - bottom);
  const dateAt = i => {
    const date = new Date(`${DEMO_DATE}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (count - 1 - i) * 7);
    return date.toISOString().slice(0, 10);
  };
  const shortDate = i => dateAt(i).slice(5).replace('-', '.');
  const exportValues = () => downloadFile(makeCSV(['观察日期', ...visible.map(t => t.title), '数据性质'], Array.from({ length: count }, (_, i) => [dateAt(i), ...visible.map(t => t.history.slice(-count)[i]), '演示时间序列 · 社媒热度指数 / 100'])), `观潮-社媒热度曲线-${DEMO_DATE}.csv`);

  if (!hasHistory) return <div className="chart-empty"><BarChart3 size={28} /><p>{mode !== 'demo' ? lines.length ? '已有观察快照，尚无历史曲线' : '当前范围暂无观察记录' : '暂无匹配的时间序列'}</p><span>{mode !== 'demo' ? lines.length ? '原始记录可在下方卡片查看；不会用单次数据补造趋势。' : '导入调研记录，或调整筛选后重试。' : '调整市场、品类或节日筛选后重试。'}</span></div>;

  return <div className="trend-chart-component">
    <div className="chart-legend" role="group" aria-label="显示或隐藏趋势曲线">{lines.map((t, index) => <button key={t.id} className={`legend-button chart-color-${index} ${hidden.includes(t.id) ? 'muted' : ''}`} aria-pressed={!hidden.includes(t.id)} onClick={() => setHidden(old => old.includes(t.id) ? old.filter(id => id !== t.id) : [...old, t.id])}><i />{t.title}</button>)}</div>
    <div className="line-chart" ref={chartRef}>
      {visible.length ? <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="领先研究记录的社媒热度示例曲线，指数0至100；下方提供日期选择与数据表" onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); setActive(Math.max(0, Math.min(count - 1, Math.round(((event.clientX - rect.left) / rect.width * width - left) / (width - left - right) * (count - 1))))); }}>
        {[0, 25, 50, 75, 100].map(value => <g key={value}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} className="grid-line" /><text x={left - 10} y={y(value) + 4} textAnchor="end">{value}</text></g>)}
        {Array.from({ length: count }, (_, i) => (count === 5 || i % 3 === 0) && <text key={i} x={x(i)} y={height - 6} textAnchor="middle">{shortDate(i)}</text>)}
        <line x1={x(selected)} x2={x(selected)} y1={top} y2={height - bottom} className="hover-line" />
        {lines.map((t, index) => {
          if (hidden.includes(t.id)) return null;
          const values = t.history.slice(-count);
          const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
          return <g key={t.id} className={`chart-color-${index}`}><path d={path} className="trend-line" strokeDasharray={['', '8 4', '2 4'][index]} /><circle cx={x(selected)} cy={y(values[selected])} r="4.5" className="line-end" /></g>;
        })}
      </svg> : <div className="chart-empty"><p>曲线已全部隐藏</p><button className="button secondary" onClick={() => setHidden([])}>恢复全部曲线</button></div>}
    </div>
    {visible.length > 0 && <><div className="chart-date-control"><label htmlFor={inputId}>观察日期 <strong>{dateAt(selected)}</strong></label><input id={inputId} type="range" min={0} max={count - 1} value={selected} onChange={e => setActive(Number(e.target.value))} aria-label="选择图表观察日期" aria-valuetext={`${dateAt(selected)}，${visible.map(t => `${t.title} ${t.history.slice(-count)[selected]}`).join('，')}`} /></div><div className="chart-readout">{visible.map(t => <span key={t.id}>{t.title}<strong>{t.history.slice(-count)[selected]}</strong></span>)}</div></>}
    <details className="chart-data"><summary>查看图表数据<ChevronDown size={15} /></summary><div className="chart-table-wrap" role="region" aria-label="社媒热度数据表" tabIndex={0}><table><caption>示例社媒热度指数（0–100）· 与当前显示曲线一致</caption><thead><tr><th scope="col">观察日期</th>{visible.map(t => <th scope="col" key={t.id}>{t.title}</th>)}</tr></thead><tbody>{Array.from({ length: count }, (_, i) => <tr key={i}><th scope="row">{dateAt(i)}</th>{visible.map(t => <td key={t.id}>{t.history.slice(-count)[i]}</td>)}</tr>)}</tbody></table></div><button className="text-button" onClick={exportValues} disabled={!visible.length}><Download size={14} />下载当前曲线 CSV</button>{!visible.length && <p>恢复至少一条曲线后可下载数据。</p>}</details>
  </div>;
}
