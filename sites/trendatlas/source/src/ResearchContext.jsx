import React from 'react';
import { ArrowRight, Database, X } from 'lucide-react';
import { observationWindow, opportunityScore } from './data.js';
import { assetUrl } from './assets.js';

export function ResearchContext({ records, mode, anchor, days, filters, onSources, onClear }) {
  const window = observationWindow(anchor, days);
  const latest = records.reduce((date, record) => record.observedAt > date ? record.observedAt : date, '');
  const dates = `${window.start.replaceAll('-', '.')} — ${window.end.replaceAll('-', '.')}`;
  return <section className="research-context" aria-label="当前研究范围与数据依据">
    <div className="research-context-line"><span className={`provenance-label ${mode === 'demo' ? 'provenance-demo' : ''}`}><Database size={14} />{mode === 'demo' ? '示例研究' : '团队调研'}</span><span className="result-count" role="status" aria-live="polite" aria-atomic="true"><strong>{records.length}</strong> 条匹配记录</span><span className="observation-window">观察窗 {dates}</span><button className="text-button" onClick={onSources}>{mode === 'demo' ? '导入真实调研' : '管理数据来源'}<ArrowRight size={14} /></button></div>
    <div className="research-context-detail"><span>{mode === 'demo' ? '构造样本，非实时采集' : '用户提供，保留原始依据'}</span><span>{latest ? `最近观察 ${latest.replaceAll('-', '.')}` : '当前范围暂无观察记录'}</span></div>
    {filters.length > 0 && <div className="active-filters" role="group" aria-label="已启用筛选">{filters.map(filter => <button key={filter.key} className="filter-chip" aria-label={`移除${filter.label}筛选`} onClick={filter.remove}><span>{filter.label}</span><X size={12} /></button>)}<button className="text-button" onClick={onClear}>清除筛选</button></div>}
  </section>;
}

export function ResearchFocus({ trend, mode, timing, onOpen, onClear, onSources, datasetEmpty }) {
  return <section className="research-focus">
    <div className="focus-content"><div className="focus-eyebrow">本轮研究焦点 <span>{mode === 'demo' ? '示例排序' : '按机会分排序'}</span></div><h2>{trend ? trend.title : '从一条有依据的观察开始'}</h2><p>{trend ? trend.productIdea || trend.brief || '查看内容与来源，明确产品方向和下一步打样任务。' : '当前范围没有可比较的记录，调整筛选或导入团队的调研资料。'}</p><div className="focus-actions"><button onClick={() => trend ? onOpen(trend) : datasetEmpty ? onSources() : onClear()}>{trend ? '查看依据与打样方向' : datasetEmpty ? '导入调研记录' : '清除筛选'}<ArrowRight size={16} /></button>{trend && <span>机会分 <strong>{opportunityScore(trend)}/100</strong> · 供调研排序参考</span>}</div></div>
    <div className="focus-image"><img src={trend?.image || assetUrl('images/christmas.jpg')} alt="产品风格参考，非社媒原帖" /><div className="focus-cycle"><span>开发至到仓</span><strong>{timing.leadWeeks === 13 ? '约 3 个月' : `${timing.leadWeeks} 周`}</strong></div><span className="focus-photo-note">灵感参考图</span></div>
  </section>;
}
