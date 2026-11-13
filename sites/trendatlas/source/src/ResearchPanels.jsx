import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, ExternalLink, FlaskConical, Gift, Lightbulb, Sparkles } from 'lucide-react';
import { MARKETS, holidayLabel, primaryPlatform, researchUrl } from './data.js';
import { LEAD_WEEK_OPTIONS, SHELF_WEEK_OPTIONS, quarterOf, seasonalSchedule } from './seasonal.js';
import { PlanAction } from './ActionControls.jsx';

const formatCount = value => value === null || value === undefined || value === '' ? '—' : new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export function SocialContentCard({ trend, mode, saved, planned, onSave, onPlan, onOpen, SourceBadge, IconButton }) {
  const platform = primaryPlatform(trend);
  return <article className="social-content-card panel">
    <div className={`social-reference ${!trend.image ? 'reference-without-photo' : ''}`}>
      {trend.image ? <img src={trend.image} alt={`${trend.title}风格参考，非原帖截图`} loading="lazy" /> : <Gift size={36} strokeWidth={1.2} />}
      <span className="content-format-label">{trend.format || '形式待记录'}</span>
      <span className="social-reference-note">{trend.image ? '风格参考图 · 非原帖' : '尚未提供内容配图'}</span>
    </div>
    <div className="social-content-body">
      <div className="social-content-meta"><SourceBadge name={platform || '未标注平台'} /><span>{MARKETS[trend.market]} · {holidayLabel(trend)}</span></div>
      <button className="title-button social-hook" onClick={() => onOpen(trend)}><h3>{trend.hook || trend.title}</h3><ArrowUpRight size={16} /></button>
      <div className="content-observed">{trend.observedAt} 观察 · {mode === 'demo' ? '示例内容拆解' : '团队调研记录'}</div>
      <div className="content-metrics"><div><strong title={trend.views == null ? '尚未记录' : String(trend.views)}>{formatCount(trend.views)}</strong><span>{platform === 'Pinterest' ? '曝光' : '播放'}{mode === 'demo' ? '（示例）' : ''}</span></div><div><strong title={trend.likes == null ? '尚未记录' : String(trend.likes)}>{formatCount(trend.likes)}</strong><span>点赞{mode === 'demo' ? '（示例）' : ''}</span></div><div><strong className={trend.growth >= 0 ? 'positive' : 'negative'}>{trend.growth > 0 ? '+' : ''}{trend.growth}%</strong><span>趋势热度环比</span></div></div>
      <div className="product-transfer"><Lightbulb size={16} /><div><span>新品切入点</span><p>{trend.productIdea || trend.brief || '尚未填写，查看详情后可加入企划继续研究。'}</p></div></div>
      <div className="social-card-actions"><div>{trend.postUrl ? <a className="text-button" aria-label={`查看${trend.title}原帖`} href={trend.postUrl} target="_blank" rel="noreferrer">查看原帖<ExternalLink size={13} /></a> : <a className="text-button" aria-label={`在${platform || '来源平台'}检索${trend.title}`} href={researchUrl(trend, platform)} target="_blank" rel="noreferrer">继续检索<ExternalLink size={13} /></a>}<button className="text-button" aria-label={`查看${trend.title}的内容拆解与完整指标`} onClick={() => onOpen(trend)}>内容拆解<ArrowRight size={13} /></button></div><div><IconButton label={`${saved ? '取消收藏' : '收藏'}${trend.title}`} className={saved ? 'is-saved' : ''} aria-pressed={saved} onClick={() => onSave(trend.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></IconButton><PlanAction trend={trend} planned={planned} onPlan={onPlan} /></div></div>
    </div>
  </article>;
}

export function ProductBrief({ trend }) {
  return <section className="brief-section"><h3><Sparkles size={17} />从热门内容，找到新品切入点</h3><div className="product-brief-steps"><div><span className="brief-step-number">01</span><div><h4>内容怎么吸引关注</h4><p>{trend.mechanism || '尚未记录内容机制。建议补充开头、场景、用户评论和原帖证据。'}</p></div></div><div><span className="brief-step-number">02</span><div><h4>可以开发什么产品</h4><p>{trend.productIdea || trend.brief || '尚未填写产品转化方向。'}</p></div></div><div><span className="brief-step-number">03</span><div><h4>先验证什么样品</h4><p>{trend.sampleTask || '尚未填写打样任务，可在季度企划中补充。'}</p></div></div></div></section>;
}

export function SeasonalCalendar({ quarter, anchor, timing, onTimingChange, onExplore }) {
  const [market, setMarket] = useState('all');
  const schedule = useMemo(() => seasonalSchedule({ anchor, market, year: Number(quarter.slice(0, 4)), ...timing }), [anchor, market, quarter, timing]);
  const starts = schedule.filter(item => item.daysUntilKickoff >= 0 && quarterOf(item.kickoffDate) === quarter);
  return <section className="seasonal-calendar panel">
    <div className="seasonal-calendar-heading"><div><span className="eyebrow">PLAN BEFORE THE SEASON</span><h2>{quarter.slice(0, 4)} 节日开发倒排</h2><p>先定上架时间，再倒推设计、打样与交付。</p></div><span className="calendar-quarter-note">{quarter.replace('-', ' ')} · {starts.length} 个建议启动节点</span></div>
    {!starts.length && <p className="calendar-empty-explanation">本季度暂无待启动的节日节点，仍可安排已启动项目与常青家居产品。</p>}
    <div className="calendar-controls"><label>日历市场<select aria-label="节日日历市场" value={market} onChange={e => setMarket(e.target.value)}><option value="all">美国＋欧洲</option><option value="US">美国</option><option value="EUROPE">欧洲（英 / 德 / 法）</option>{Object.entries(MARKETS).filter(([key]) => key !== 'US').map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>开发至到仓<select aria-label="开发至到仓周期" value={timing.leadWeeks} onChange={e => onTimingChange({ ...timing, leadWeeks: Number(e.target.value) })}>{LEAD_WEEK_OPTIONS.map(weeks => <option key={weeks} value={weeks}>{weeks === 13 ? '约3个月（13周）' : `${weeks} 周`}</option>)}</select></label><label>提前上架<select aria-label="节日前上架周数" value={timing.shelfWeeks} onChange={e => onTimingChange({ ...timing, shelfWeeks: Number(e.target.value) })}>{SHELF_WEEK_OPTIONS.map(weeks => <option key={weeks} value={weeks}>{weeks} 周</option>)}</select></label><span>{timing.leadWeeks === 13 ? '已确认约3个月 · 上架前置可调整' : '自定义开发周期 · 上架前置可调整'}</span></div>
    <div className="seasonal-calendar-grid">{schedule.map(item => <article className={`holiday-window ${item.daysUntilKickoff < 0 ? 'window-passed' : ''} ${starts.some(start => start.id === item.id) ? 'window-current' : ''}`} key={item.id}><div className="holiday-window-top"><h3>{item.title}</h3><span>{item.eventDate.slice(5).replace('-', '.')}</span></div><span className="holiday-market">{market === 'all' ? item.marketLabel : market === 'EUROPE' ? '英 / 德 / 法' : MARKETS[market]}</span><dl><div><dt>建议开发启动</dt><dd>{item.kickoffDate}</dd></div><div><dt>目标上架</dt><dd>{item.shelfDate}</dd></div></dl><div className="holiday-window-status"><span />{starts.some(start => start.id === item.id) ? '本季度启动开发' : item.status}</div><button className="text-button" onClick={() => onExplore(item.id, market)}>查看设计方向<ArrowRight size={13} /></button></article>)}</div>
    <div className="calendar-footnote"><FlaskConical size={15} /><p>开发启动 = 节日 − 提前上架周数 − 开发至到仓周期。已过窗口的节日优先复盘或现有款快改；新模具与新工艺需另行确认时间。复活节按欧美西方教会日历，感恩节仅列美国。</p></div>
  </section>;
}
