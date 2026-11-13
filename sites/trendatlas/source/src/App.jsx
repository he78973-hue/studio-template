import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, Bookmark, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Compass, Database, ExternalLink, FileDown, Globe2, Layers3, LayoutDashboard, Leaf, Menu, Plus, Search, ShoppingBag, SlidersHorizontal, Sparkles, Sprout, TrendingUp, Upload, Waves, X } from 'lucide-react';
import { CATEGORIES, DEMO_DATE, HOLIDAYS, MARKETS, SOURCES, demoTrends, filterTrends, holidayLabel, nextQuarters, opportunityScore, primaryPlatform, quarterMonths, researchUrl, sourceSlug } from './data.js';
import { downloadFile, makeCSV, templateCSV, trendCSV, validateImport } from './csv.js';
import { ProductBrief, SeasonalCalendar, SocialContentCard } from './ResearchPanels.jsx';
import { resolveTiming } from './seasonal.js';
import { PlanAction } from './ActionControls.jsx';
import { ResearchContext, ResearchFocus } from './ResearchContext.jsx';
import { TrendChart } from './TrendChart.jsx';

const NAV = [
  { id: 'overview', label: '新品机会总览', en: 'Overview', icon: LayoutDashboard },
  { id: 'trends', label: '社媒热门内容', en: 'Content to product', icon: Compass },
  { id: 'retail', label: '商超观察', en: 'Retail insights', icon: ShoppingBag },
  { id: 'planner', label: '季度新品企划', en: 'Seasonal planning', icon: Layers3 },
  { id: 'saved', label: '灵感收藏', en: 'My collection', icon: Bookmark },
];
const PAGE_COPY = {
  overview: ['新品机会总览', '聚焦欧美节日装饰与家居用品，把社媒热度转成新品方向。'],
  trends: ['社媒热门内容', '看懂什么内容吸引关注，再拆解成可以打样的产品。'],
  retail: ['商超观察', '把线上灵感放回货架，寻找更有依据的产品方向。'],
  planner: ['季度新品企划', '区分开发月份与售卖节日，把内容灵感排进新品计划。'],
  saved: ['灵感收藏', '留住有价值的信号，慢慢长成你的下一季。'],
  sources: ['数据来源', '每一个趋势，都应该知道从哪里来。'],
};
const STATUS = ['待调研', '设计中', '已完成'];
const provenanceText = mode => mode === 'demo' ? '演示数据 · 非真实市场结论' : '用户导入 · 未经平台独立核验';

function readStored(key, fallback, valid) {
  try {
    const value = JSON.parse(localStorage.getItem(`trendatlas:${key}`));
    return value !== null && (!valid || valid(value)) ? value : fallback;
  } catch { return fallback; }
}

function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function Modal({ title, eyebrow, children, onClose, wide = false }) {
  const ref = useRef(null);
  const returnFocus = useRef(document.activeElement);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      requestAnimationFrame(() => {
        if (!document.querySelector('dialog[open]')) {
          const target = returnFocus.current?.isConnected ? returnFocus.current : document.querySelector('main h1');
          target?.focus();
        }
      });
    };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-inner">
      <div className="modal-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 id={titleId}>{title}</h2></div><IconButton label="关闭弹窗" onClick={onClose}><X size={20} /></IconButton></div>
      {children}
    </div>
  </dialog>;
}

function EmptyState({ title = '这里还没有匹配的趋势', description = '试试其他市场或品类，给灵感多一点空间。', action, actionLabel = '清除筛选' }) {
  return <div className="empty-state"><Sprout size={34} strokeWidth={1.3} /><h3>{title}</h3><p>{description}</p>{action && <button className="button secondary" onClick={action}>{actionLabel}<ArrowRight size={15} /></button>}</div>;
}

function SourceBadge({ name }) {
  const source = SOURCES.find(s => s.name === name);
  return <span className={`source-badge source-${sourceSlug(name)}`} title={name}><span className="source-mark">{source?.short || name[0]}</span>{name}</span>;
}

function SectionHeading({ title, subtitle, action, label = '查看全部' }) {
  return <div className="section-heading"><div className="section-title"><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>{action && <button className="text-button" onClick={action}>{label}<ArrowRight size={15} /></button>}</div>;
}

function TrendCard({ trend, saved, onSave, onOpen, onPlan, planned }) {
  const score = opportunityScore(trend);
  return <article className="trend-card">
    <div className={`trend-image ${!trend.image ? 'image-fallback' : ''}`}>
      <button className="image-open" onClick={() => onOpen(trend)} aria-label={`查看${trend.title}详情`}>
        {trend.image ? <img src={trend.image} alt={`${trend.title}的风格灵感参考`} loading="lazy" /> : <div className="reference-text"><Leaf size={32} /><span>{trend.category}</span><small>用户调研记录</small></div>}
      </button>
      <span className={`card-status ${score >= 75 ? 'high' : ''}`}><span />{score >= 75 ? '高潜力' : trend.growth < 0 ? '持续观察' : '正在升温'}</span>
      <IconButton label={`${saved ? '取消收藏' : '收藏'}${trend.title}`} className={`save-button ${saved ? 'is-saved' : ''}`} aria-pressed={saved} onClick={() => onSave(trend.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></IconButton>
      {trend.image && <span className="photo-caption">灵感参考图</span>}
    </div>
    <div className="trend-body">
      <div className="trend-meta"><span>{trend.category}</span><span>{MARKETS[trend.market]}</span></div>
      <span className="holiday-tag">{holidayLabel(trend)}</span>
      <button className="title-button" onClick={() => onOpen(trend)}><h3>{trend.title}</h3><ArrowUpRight size={16} /></button>
      <div className="trend-english">{trend.en || 'Research observation'}</div>
      <div className="trend-tags">{trend.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>
      <div className="trend-card-bottom"><div><span className="small-muted">热度环比</span><strong className={trend.growth >= 0 ? 'positive' : 'negative'}>{trend.growth >= 0 ? <TrendingUp size={15} /> : null}{trend.growth > 0 ? '+' : ''}{trend.growth}%</strong></div><span className="score-label">机会分 <b>{score}</b></span></div>
      <div className="card-sources"><div className="mini-sources">{trend.sources.slice(0, 3).map(source => <span key={source} className={`mini-source source-${sourceSlug(source)}`} title={source}>{SOURCES.find(s => s.name === source)?.short}</span>)}<span>{trend.sources.length} 个来源标签</span></div><PlanAction trend={trend} planned={planned} onPlan={onPlan} /></div>
    </div>
  </article>;
}

function Metric({ label, value, icon: Icon, caption, unit = '', onInfo }) {
  return <div className="metric"><div className="metric-top"><span><Icon size={16} />{label}</span><IconButton label={`了解${label}口径`} onClick={onInfo}><CircleHelp size={15} /></IconButton></div><div className="metric-value"><strong>{value}{unit && <span>{unit}</span>}</strong></div><div className="metric-caption">{caption}</div></div>;
}

function TrendDetail({ trend, mode, onClose, saved, onSave, onPlan, planned }) {
  return <Modal title={trend.title} eyebrow={`${trend.en || trend.category} / TREND BRIEF`} onClose={onClose} wide>
    <div className="detail-meta"><span>{MARKETS[trend.market]} · {trend.category}</span><span>观察日期 {trend.observedAt}</span></div>
    <div className="detail-context"><span className="holiday-tag">{holidayLabel(trend)}</span><span>{primaryPlatform(trend) || '未标注平台'} · {trend.format || '内容形式待记录'}</span></div>
    <div className="data-disclosure"><Database size={16} /><span>{provenanceText(mode)}。{mode === 'demo' ? '以下指标仅用于演示分析流程。' : '请结合原始记录核查指标口径。'}</span></div>
    <div className="detail-metrics"><div><span>社媒热度</span><strong>{trend.social}<small>/100</small></strong></div><div><span>零售信号</span><strong>{trend.retail}<small>/100</small></strong></div><div><span>热度环比</span><strong className={trend.growth >= 0 ? 'positive' : 'negative'}>{trend.growth > 0 ? '+' : ''}{trend.growth}%</strong></div><div><span>机会分</span><strong>{opportunityScore(trend)}<small>/100</small></strong></div></div>
    <section className="raw-content-values"><h3>原始内容指标 <span>{mode === 'demo' ? '示例数值' : '用户提供'} · {trend.observedAt}</span></h3><dl><div><dt>{primaryPlatform(trend) === 'Pinterest' ? '曝光' : '播放'}</dt><dd>{trend.views == null ? '未记录' : Number(trend.views).toLocaleString('zh-CN')}</dd></div><div><dt>点赞</dt><dd>{trend.likes == null ? '未记录' : Number(trend.likes).toLocaleString('zh-CN')}</dd></div></dl></section>
    <ProductBrief trend={trend} />
    {trend.postUrl && <a className="text-link" href={trend.postUrl} target="_blank" rel="noreferrer">查看这条内容的原帖<ExternalLink size={14} /></a>}
    <section className="brief-section"><h3><Sparkles size={17} />设计可以怎么做？</h3><p>{trend.brief || '尚未填写设计建议。加入季度企划后，可补充产品方向与下一步任务。'}</p><div className="trend-tags">{trend.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{trend.colors.length > 0 && <div className="color-palette">{trend.colors.map(color => <span key={color}><i style={{ background: color }} />{color.toUpperCase()}</span>)}<small>参考配色</small></div>}</section>
    <section className="brief-section"><h3>来源与进一步调研</h3><p className="small-muted">{mode === 'demo' ? '以下为站内搜索或发现入口，不是示例指标的原始证据。' : '原始链接由导入者提供；其他入口用于继续检索。'}</p><div className="detail-sources">{trend.sources.map(source => <a key={source} href={researchUrl(trend, source)} target="_blank" rel="noreferrer"><SourceBadge name={source} /><ExternalLink size={14} /></a>)}</div>{trend.url && <a className="text-link" href={trend.url} target="_blank" rel="noreferrer">查看导入记录的原始链接<ExternalLink size={14} /></a>}</section>
    <div className="method-note">机会分 = 社媒热度 × 45% + 零售信号 × 35% + 正向增长（上限 100）× 20%。这是可解释的选题参考分，不代表销量预测。</div>
    <div className="modal-actions"><button className="button secondary" onClick={() => onSave(trend.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '已收藏' : '收藏趋势'}</button><button className="button primary" onClick={() => onPlan(trend)}>{planned ? <Check size={16} /> : <Plus size={16} />}{planned ? '查看季度企划' : '加入季度企划'}</button></div>
  </Modal>;
}

function PlanEditor({ trend, existing, quarter, mode, onSave, onClose }) {
  const months = quarterMonths(quarter);
  const [error, setError] = useState('');
  const submit = event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const title = values.get('title').trim();
    if (!title) { setError('请填写选题名称。'); return; }
    onSave({ id: existing?.id || crypto.randomUUID(), trendId: existing?.trendId || trend?.id || null, title, brief: values.get('brief').trim(), month: Number(values.get('month')), status: values.get('status'), quarter, mode, category: existing?.category || trend?.category || '自主选题', festival: values.get('festival'), market: values.get('market'), productIdea: values.get('productIdea').trim(), sampleTask: values.get('sampleTask').trim(), postUrl: existing?.postUrl || trend?.postUrl || '' });
  };
  return <Modal title={existing?.id ? '编辑设计选题' : '把灵感排进下一季'} eyebrow={`${quarter.replace('-', ' ')} / DESIGN PLAN`} onClose={onClose}>
    <form onSubmit={submit} className="plan-form">
      <label>选题名称<input name="title" defaultValue={existing?.title || trend?.title || ''} maxLength={100} required autoFocus /></label>
      <div className="form-row"><label>目标节日<select name="festival" defaultValue={existing?.festival || trend?.festival || 'unassigned'}>{Object.entries(HOLIDAYS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>目标市场<select name="market" defaultValue={existing?.market || trend?.market || ''}><option value="">待确认</option>{Object.entries(MARKETS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
      <div className="form-row"><label>开发任务月份<select name="month" defaultValue={existing?.month || months[0]}>{months.map(month => <option key={month} value={month}>{month} 月</option>)}</select></label><label>当前阶段<select name="status" defaultValue={existing?.status || '待调研'}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></label></div>
      <label>可开发的产品系列<input name="productIdea" defaultValue={existing?.productIdea || trend?.productIdea || ''} maxLength={300} /></label>
      <label>优先打样任务<textarea name="sampleTask" rows={2} defaultValue={existing?.sampleTask || trend?.sampleTask || ''} maxLength={1000} placeholder="例如：两种丝绒材质、三个尺寸，比较定型与平摊包装效果。" /></label>
      <label>设计方向与补充说明<textarea name="brief" rows={3} defaultValue={existing?.brief || trend?.brief || ''} maxLength={2000} /></label>
      <p className="form-note">这里安排的是开发任务月份，目标售卖节日需结合上方倒排日历确认。<br />保存到当前浏览器 · {mode === 'demo' ? '演示数据工作区' : '导入数据工作区'}</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>取消</button><button className="button primary" type="submit"><Check size={16} />保存选题</button></div>
    </form>
  </Modal>;
}

function SourcesView({ mode, setMode, imported, onImport, notify }) {
  const input = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceInfo, setSourceInfo] = useState(null);
  const handleFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      if (file.size > 2_000_000) throw new Error('文件过大，请使用 2 MB 以内的 CSV。');
      const data = validateImport(await file.text());
      onImport(data); notify(`已导入 ${data.length} 条调研记录`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); event.target.value = ''; }
  };
  return <div className="sources-view">
    <div className="source-intro panel"><div className="source-intro-icon"><Database size={26} /></div><div><h2>从欧美内容与货架，追踪新品机会</h2><p>社媒重点：TikTok、Pinterest、Instagram。欧洲零售补充 IKEA 与 Action；当前自动采集尚未配置，可先导入真实调研。</p></div><span className="neutral-badge">0 / {SOURCES.length} 已连接</span></div>
    <div className="source-grid">{SOURCES.map(source => <article className="source-panel panel" key={source.name}><div className="source-panel-top"><SourceBadge name={source.name} /><span className="small-muted">{source.type === 'social' ? '社交媒体' : '零售平台'}</span></div><p>{source.description}</p><div className="source-panel-bottom"><span className="connection-status"><span />未接入</span><button className="text-button" onClick={() => setSourceInfo(source)}>接入说明<ArrowUpRight size={14} /></button></div></article>)}</div>
    <section className="panel import-panel"><div><span className="eyebrow">YOUR RESEARCH, CONNECTED</span><h2>让已有调研，进入同一张看板</h2><p>导入 CSV 后，筛选、内容拆解与新品企划都能使用你的数据。</p><div className="data-mode-switch" aria-label="数据工作区"><button className={mode === 'demo' ? 'selected' : ''} onClick={() => setMode('demo')}>演示数据 · {demoTrends.length} 条</button><button className={mode === 'imported' ? 'selected' : ''} onClick={() => setMode('imported')}>我的调研 · {imported.length} 条</button></div><p className="form-note">两个工作区独立展示。重新导入将替换「我的调研」数据，收藏与已保存企划保留。数据仅存于本机浏览器。</p></div><div className="import-box"><Upload size={27} /><h3>导入趋势调研记录</h3><p>UTF-8 CSV · 最大 2 MB · 最多 2,000 条</p><input ref={input} className="sr-only" type="file" accept=".csv,text/csv" aria-label="导入 CSV 文件" onChange={handleFile} /><button className="button primary" onClick={() => input.current.click()} disabled={busy}><Upload size={16} />{busy ? '正在校验…' : '选择 CSV 文件'}</button><button className="text-button" onClick={() => downloadFile(templateCSV(new Date().toISOString().slice(0, 10)), '观潮-调研导入模板.csv')}><FileDown size={14} />下载填写模板</button>{error && <p className="form-error" role="alert">{error}</p>}</div></section>
    <details className="panel import-help"><summary>导入字段与指标口径<ChevronDown size={16} /></summary><div><p><b>必填：</b>title 趋势名称、category 品类（含节日装饰）、market 市场（US / UK / DE / FR）、sources 来源（多个用 | 分隔）、social 社媒热度（0–100）、retail 零售信号（0–100）、growth 环比百分比、observedAt 观察日期（YYYY-MM-DD）。</p><p><b>可留空但保留列名：</b>en 英文名称、url 原始依据、tags 标签、brief 设计建议。</p><p><b>新增可选列，兼容旧模板：</b>festival 节日、platform 内容平台、format 内容形式、hook 标题或开头、mechanism 内容机制、productIdea 新品方向、sampleTask 打样任务、views 曝光/播放、likes 点赞、postUrl 原帖链接。未知的原始数据留空，页面显示「—」，不自动补 0。</p><p>热度与零售指数由调研者按统一口径提供。不同平台的曝光、播放不直接等同；增幅指趋势指数环比，不是单帖播放增幅。零售信号不是销售额，当前 CSV 不导入历史时间序列。</p></div></details>
    {sourceInfo && <Modal title={`${sourceInfo.name} 接入说明`} eyebrow="DATA CONNECTION" onClose={() => setSourceInfo(null)}><p className="modal-copy">{sourceInfo.access}</p><div className="method-note">落地自动采集时，需要为来源配置采集服务、字段映射和更新频率，并保存原始链接、市场、采集时间与指标口径。当前版本没有运行该平台的抓取任务。</div><div className="modal-actions"><a className="button primary" href={sourceInfo.url} target="_blank" rel="noreferrer">打开官方入口<ExternalLink size={15} /></a></div></Modal>}
  </div>;
}

export default function App() {
  const [view, setView] = useState('overview');
  const [mode, setMode] = useState(() => readStored('mode', 'demo', v => ['demo', 'imported'].includes(v)));
  const [imported, setImported] = useState(() => readStored('imports', [], v => Array.isArray(v) && v.every(t => typeof t.title === 'string' && Array.isArray(t.sources) && Array.isArray(t.tags) && Array.isArray(t.history) && Array.isArray(t.colors))));
  const [saved, setSaved] = useState(() => readStored('saved', [], v => Array.isArray(v) && v.every(id => typeof id === 'string')));
  const [plans, setPlans] = useState(() => readStored('plans', [], v => Array.isArray(v) && v.every(p => typeof p.title === 'string' && STATUS.includes(p.status))));
  const [market, setMarket] = useState('all');
  const [category, setCategory] = useState('all');
  const [festival, setFestival] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [timing, setTiming] = useState(() => resolveTiming(readStored('timing', null)));
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('score');
  const [quarter, setQuarter] = useState(() => nextQuarters(new Date(`${DEMO_DATE}T12:00:00`))[0]);
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const searchRef = useRef(null);
  const restoreSidebarFocus = useRef(false);
  const toastTimer = useRef(null);
  const titleRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);
  const anchor = mode === 'demo' ? DEMO_DATE : today;
  const activeData = mode === 'demo' ? demoTrends : imported;
  const quarters = [...new Set([quarter, ...nextQuarters(new Date(`${anchor}T12:00:00`))])].sort();
  const currentNav = NAV.find(n => n.id === view);
  const [title, subtitle] = PAGE_COPY[view];
  const filtered = useMemo(() => filterTrends(activeData, { market, category, festival, platform: view === 'trends' ? platform : 'all', query, days, anchor, channel: view === 'trends' ? 'social' : view === 'retail' ? 'retail' : 'all' }), [activeData, market, category, festival, platform, query, days, anchor, view]);
  const visibleTrends = useMemo(() => {
    const list = view === 'saved' ? filtered.filter(t => saved.includes(t.id)) : [...filtered];
    if (sort === 'growth') list.sort((a, b) => b.growth - a.growth);
    if (sort === 'retail') list.sort((a, b) => b.retail - a.retail);
    if (sort === 'views') list.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
    return list;
  }, [filtered, view, saved, sort]);
  const currentPlans = plans.filter(p => p.mode === mode && p.quarter === quarter);
  const filteredPlans = currentPlans.filter(p => `${p.title} ${p.brief} ${p.productIdea || ''} ${p.sampleTask || ''} ${HOLIDAYS[p.festival] || ''}`.toLowerCase().includes(query.toLowerCase()));
  const currentSaved = activeData.filter(t => saved.includes(t.id));
  const highPotential = filtered.filter(t => opportunityScore(t) >= 75);
  const avg = key => filtered.length ? Math.round(filtered.reduce((sum, trend) => sum + trend[key], 0) / filtered.length) : '—';

  useEffect(() => {
    try {
      localStorage.setItem('trendatlas:mode', JSON.stringify(mode));
      localStorage.setItem('trendatlas:imports', JSON.stringify(imported));
      localStorage.setItem('trendatlas:saved', JSON.stringify(saved));
      localStorage.setItem('trendatlas:plans', JSON.stringify(plans));
      localStorage.setItem('trendatlas:timing', JSON.stringify(timing));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [mode, imported, saved, plans, timing]);
  useEffect(() => {
    const onKey = event => { if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); searchRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => {
    if (!sidebarOpen) {
      if (restoreSidebarFocus.current) {
        restoreSidebarFocus.current = false;
        document.querySelector('.mobile-menu')?.focus();
      }
      return;
    }
    const sidebar = document.querySelector('.sidebar');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (sidebar.querySelector('.nav-item.active') || sidebar.querySelector('.brand'))?.focus();
    const onKey = event => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        restoreSidebarFocus.current = true;
        setSidebarOpen(false);
      }
      if (event.key === 'Tab') {
        const items = [...sidebar.querySelectorAll('button:not(:disabled)')];
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); };
  }, [sidebarOpen]);

  const notify = (message, undo, action) => { clearTimeout(toastTimer.current); setToast({ message, undo, action }); toastTimer.current = setTimeout(() => setToast(null), undo || action ? 8000 : 4000); };
  const navigate = next => { setView(next); setSidebarOpen(false); setQuery(''); setSort(next === 'retail' ? 'retail' : 'score'); window.scrollTo({ top: 0 }); requestAnimationFrame(() => titleRef.current?.focus()); };
  const resetFilters = () => { setMarket('all'); setCategory('all'); setFestival('all'); setPlatform('all'); setQuery(''); };
  const toggleSave = id => { setSaved(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); notify(saved.includes(id) ? '已从灵感收藏中移除' : '已收入灵感收藏'); };
  const isPlanned = trend => currentPlans.some(p => p.trendId === trend.id);
  const addPlan = trend => { setDetail(null); if (isPlanned(trend)) navigate('planner'); else setEditor({ trend }); };
  const savePlan = plan => { setPlans(old => old.some(p => p.id === plan.id) ? old.map(p => p.id === plan.id ? plan : p) : [...old, plan]); setEditor(null); notify('选题已保存到季度新品企划', undefined, { label: '查看企划', run: () => navigate('planner') }); };
  const deletePlan = plan => { setPlans(old => old.filter(p => p.id !== plan.id)); notify('选题已移除', () => setPlans(old => [...old, plan])); };
  const switchMode = next => { setMode(next); setQuery(''); setMarket('all'); setCategory('all'); setFestival('all'); setPlatform('all'); };
  const importData = data => { setImported(data); switchMode('imported'); setDays(90); };
  const exportTrends = () => { downloadFile(trendCSV(visibleTrends, provenanceText(mode)), `观潮-趋势简报-${anchor}.csv`); setExportOpen(false); notify('趋势简报已生成'); };
  const exportPlan = () => { downloadFile(makeCSV(['开发季度', '开发月份', '选题', '品类', '目标节日', '目标市场', '状态', '新品系列', '打样任务', '设计方向', '原帖链接', '数据性质'], filteredPlans.map(p => [p.quarter, p.month, p.title, p.category, HOLIDAYS[p.festival] || '待归类', MARKETS[p.market] || '待确认', p.status, p.productIdea, p.sampleTask, p.brief, p.postUrl, provenanceText(mode)])), `观潮-${quarter}-设计企划.csv`); setExportOpen(false); notify('季度企划已生成'); };
  const cards = (trends) => <div className="trend-grid">{trends.map(trend => <TrendCard key={trend.id} trend={trend} saved={saved.includes(trend.id)} onSave={toggleSave} onOpen={setDetail} onPlan={addPlan} planned={isPlanned(trend)} />)}</div>;
  const contentCards = trends => <div className="social-content-grid">{trends.map(trend => <SocialContentCard key={trend.id} trend={trend} mode={mode} saved={saved.includes(trend.id)} planned={isPlanned(trend)} onSave={toggleSave} onPlan={addPlan} onOpen={setDetail} SourceBadge={SourceBadge} IconButton={IconButton} />)}</div>;
  const exploreHoliday = (id, region) => { navigate('trends'); setFestival(id); setMarket(region); setCategory('节日装饰'); setPlatform('all'); };
  const activeFilters = [
    market !== 'all' && { key: 'market', label: market === 'EUROPE' ? '欧洲（英 / 德 / 法）' : MARKETS[market], remove: () => setMarket('all') },
    category !== 'all' && { key: 'category', label: category === 'home' ? '家居用品' : category, remove: () => setCategory('all') },
    festival !== 'all' && { key: 'festival', label: HOLIDAYS[festival], remove: () => setFestival('all') },
    view === 'trends' && platform !== 'all' && { key: 'platform', label: platform, remove: () => setPlatform('all') },
    query.trim() && { key: 'query', label: `关键词：${query.trim()}`, remove: () => setQuery('') },
  ].filter(Boolean);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳转到主要内容</a>
    {sidebarOpen && <button className="sidebar-backdrop" aria-label="关闭导航菜单" onClick={() => { restoreSidebarFocus.current = true; setSidebarOpen(false); }} />}
    <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} role={sidebarOpen ? 'dialog' : undefined} aria-modal={sidebarOpen || undefined} aria-label="主导航菜单">
      <button className="brand" onClick={() => navigate('overview')} aria-label="观潮 TrendAtlas 首页"><span className="brand-symbol"><Waves size={25} strokeWidth={2} /></span><span><b>观潮<span className="brand-period">.</span></b><small>TrendAtlas</small></span></button>
      <div className="workspace-label"><span>欧美节日 · 家居研究</span><span>PRODUCT INTELLIGENCE</span></div>
      <nav aria-label="主导航">{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{id === 'saved' && currentSaved.length > 0 ? <span className="nav-count">{currentSaved.length}</span> : id === 'overview' ? <span className="nav-active-dot" /> : null}</button>)}</nav>
      <div className="sidebar-season"><span className="season-kicker"><Sprout size={16} />为下一季，早一步</span><h3><strong>{quarter.replace('-', ' ')}</strong><span>企划</span></h3><p>{currentPlans.length ? `${currentPlans.length} 个设计方向正在酝酿` : '把好趋势，变成好产品'}</p><button onClick={() => navigate('planner')}>进入季度企划<ArrowUpRight size={16} /></button><span className="season-ornament" aria-hidden="true"><Leaf size={85} strokeWidth={.7} /></span></div>
      <div className="sidebar-bottom"><button className={`nav-item ${view === 'sources' ? 'active' : ''}`} onClick={() => navigate('sources')} aria-current={view === 'sources' ? 'page' : undefined}><Database size={18} strokeWidth={1.7} /><span>数据来源</span><span className="connection-dot" /></button><button className="nav-item" onClick={() => setHelp(true)}><CircleHelp size={18} strokeWidth={1.7} /><span>使用指南</span><ArrowUpRight size={14} /></button><div className="user-profile"><span className="avatar">D<span /></span><div><b>设计工作室</b><small>我的研究空间</small></div><span className="workspace-edition">LOCAL</span></div></div>
    </aside>

    <div className="main-shell" inert={sidebarOpen || undefined}>
      <header className="topbar"><div className="breadcrumb"><IconButton label="打开导航菜单" className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></IconButton><span className="breadcrumb-home">工作台</span><ChevronRight size={13} /><strong>{title}</strong></div><div className="topbar-right">{view !== 'sources' && <label className="global-search"><Search size={16} /><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={view === 'planner' ? '搜索设计选题…' : '搜索趋势、品类、关键词…'} aria-label={view === 'planner' ? '搜索设计选题' : '搜索趋势、品类、关键词'} />{query ? <button aria-label="清空搜索" onClick={() => setQuery('')}><X size={13} /></button> : <kbd>/</kbd>}</label>}<span className="topbar-divider" /><button className={`demo-status ${mode === 'imported' ? 'imported-status' : ''}`} onClick={() => navigate('sources')}><span />{mode === 'demo' ? '演示工作区' : '我的调研'}<ChevronDown size={12} /></button></div></header>

      <main id="main-content" className={`main-content view-${view}`}>
        <div className="page-heading"><div><div className="page-eyebrow">{currentNav?.en || 'Data sources'} <span>/</span> DESIGNED FOR WHAT’S NEXT</div><h1 ref={titleRef} tabIndex={-1}>{title}<span className="heading-dot">.</span></h1><p>{subtitle}</p></div><div className="heading-actions">{view === 'planner' ? <><button className="button secondary" onClick={() => setExportOpen(true)}><ArrowDownToLine size={16} />导出企划</button><button className="button primary" onClick={() => setEditor({})}><Plus size={16} />新建选题</button></> : view !== 'sources' && <button className="button secondary" onClick={() => setExportOpen(true)}><ArrowDownToLine size={16} />导出趋势简报</button>}</div></div>

        {storageError && <div className="storage-warning" role="alert">浏览器本地存储不可用，当前修改刷新后可能丢失。请及时导出选题与调研记录。</div>}

        {view !== 'sources' && <div className="filter-row">
          {view !== 'planner' ? <div className="filter-controls">
            <label className="filter-select"><Globe2 size={15} /><select value={market} onChange={e => setMarket(e.target.value)} aria-label="筛选市场"><option value="all">美国＋欧洲</option><option value="EUROPE">欧洲（英 / 德 / 法）</option>{Object.entries(MARKETS).map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select><ChevronDown size={13} /></label>
            <label className="filter-select"><Layers3 size={15} /><select value={category} onChange={e => setCategory(e.target.value)} aria-label="筛选品类"><option value="all">全部产品方向</option><option value="节日装饰">节日装饰</option><option value="home">家居用品 · 全部</option><optgroup label="家居用品细分">{CATEGORIES.filter(c => c !== '节日装饰').map(c => <option key={c}>{c}</option>)}</optgroup></select><ChevronDown size={13} /></label>
            <label className="filter-select"><select aria-label="筛选节日" value={festival} onChange={e => setFestival(e.target.value)}><option value="all">全部节日 / 日常</option>{Object.entries(HOLIDAYS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><ChevronDown size={13} /></label>
            <label className="filter-select period-select"><select aria-label="观察时间范围" value={days} onChange={e => setDays(Number(e.target.value))}><option value={30}>近 30 天</option><option value={90}>近 90 天</option></select><ChevronDown size={13} /></label>
            {(market !== 'all' || category !== 'all' || festival !== 'all' || platform !== 'all' || query) && <button className="reset-button" onClick={resetFilters}>重置</button>}
          </div> : <div className="filter-controls"><label className="filter-select quarter-select"><Layers3 size={15} /><select aria-label="企划季度" value={quarter} onChange={e => setQuarter(e.target.value)}>{quarters.map(q => <option value={q} key={q}>{q.replace('-', ' ')} · 新品开发</option>)}</select><ChevronDown size={13} /></label><span className="small-muted">{currentPlans.length} 个选题 · {currentPlans.filter(p => p.status === '已完成').length} 个已完成</span></div>}
          {view === 'planner' && <div className="data-note"><span className="mini-dot" />{mode === 'demo' ? `示例数据截至 ${DEMO_DATE.replaceAll('-', '.')}` : `${imported.length} 条导入记录 · 本地存储`}<button aria-label="查看数据口径" onClick={() => setHelp(true)}><CircleHelp size={13} /></button></div>}
        </div>}
        {!['sources', 'planner'].includes(view) && <ResearchContext records={visibleTrends} mode={mode} anchor={anchor} days={days} filters={activeFilters} onSources={() => navigate('sources')} onClear={resetFilters} />}

        {view === 'overview' && <>
          <ResearchFocus trend={filtered[0]} mode={mode} timing={timing} onOpen={setDetail} onSources={() => navigate('sources')} onClear={resetFilters} datasetEmpty={!activeData.length} />

          <section className="metrics-grid" aria-label="当前筛选的研究指标"><Metric label="研究记录" value={filtered.length} icon={Compass} caption={`${filtered.filter(t => t.growth > 0).length} 条记录呈正向增长`} onInfo={() => setHelp(true)} /><Metric label="社媒热度均值" value={avg('social')} unit="/100" icon={TrendingUp} caption="当前记录的社媒研究指数" onInfo={() => setHelp(true)} /><Metric label="零售信号均值" value={avg('retail')} unit="/100" icon={ShoppingBag} caption="上新与榜单信号，非实际销量" onInfo={() => setHelp(true)} /><Metric label="优先调研记录" value={highPotential.length} icon={Sparkles} caption="机会分 ≥ 75，建议进一步核查" onInfo={() => setHelp(true)} /></section>

          <div className="analysis-grid"><section className="panel chart-panel"><SectionHeading title="领先方向的热度变化" /><div className="chart-subtitle"><span>机会分前三项 · 社媒热度指数 / 100</span><span className="chart-mode-label">{mode === 'demo' ? '示例时间序列' : '快照数据'}</span></div><TrendChart trends={filtered} days={days} mode={mode} /><div className="chart-footnote"><span>{!filtered.length ? '调整筛选或导入记录后继续研究' : mode === 'demo' ? '支持鼠标、日期滑块和数据表查看' : '原始指标见下方记录'}</span><button className="text-button" onClick={() => setHelp(true)}>指标说明<CircleHelp size={12} /></button></div></section><section className="panel opportunity-panel"><SectionHeading title="优先调研顺序" action={() => navigate('trends')} label="全部记录" /><p className="panel-description">基于当前筛选的机会分排序，不是销量预测</p><div className="ranking-list">{filtered.slice(0, 4).map((t, i) => <button className="ranking-item" key={t.id} onClick={() => setDetail(t)}><span className={`rank-number ${i === 0 ? 'rank-first' : ''}`}>{String(i + 1).padStart(2, '0')}</span><div><div className="rank-title"><span>{t.title}</span><b>{opportunityScore(t)}<small>分</small></b></div><p className="rank-next-step">{t.productIdea || t.brief || '查看原始依据，补充产品方向'}</p><div className="rank-track"><span style={{ width: `${opportunityScore(t)}%` }} /></div></div><ChevronRight size={14} /></button>)}</div>{!filtered.length && <p className="no-ranking">暂无匹配的研究记录</p>}<div className="opportunity-tip"><Sprout size={16} /><p>先核查原帖与产品可行性，再加入开发企划。</p></div></section></div>

          <section className="trends-section"><SectionHeading title="值得关注的设计方向" subtitle={`${filtered.length} 个趋势信号 · 按增长排序`} action={() => navigate('trends')} label="探索全部趋势" />{filtered.length ? cards([...filtered].sort((a, b) => b.growth - a.growth).slice(0, 4)) : <EmptyState action={resetFilters} />}</section>
          <section className="overview-content-section"><SectionHeading title="内容怎么火，产品怎么做？" subtitle="内容机制 → 产品系列 → 打样任务" action={() => navigate('trends')} label="查看内容拆解" />{filtered.some(t => primaryPlatform(t)) ? contentCards(filtered.filter(t => primaryPlatform(t)).slice(0, 2)) : <EmptyState title="暂无社媒内容线索" description="当前记录缺少社媒来源，补充调研后可继续做产品拆解。" />}</section>
          <section className="planner-callout"><div className="callout-icon"><Layers3 size={23} /></div><div><h3>好灵感，值得一个具体的计划。</h3><p>把看中的趋势加入 {quarter.replace('-', ' ')}，开始构建你的季度产品故事。</p></div><button className="button secondary" onClick={() => navigate('planner')}>打开季度企划<ArrowRight size={15} /></button></section>
        </>}

        {['trends', 'retail', 'saved'].includes(view) && <section className="explore-section">
          {view === 'retail' && <div className="retail-intro"><div className="retail-intro-copy"><ShoppingBag size={23} /><div><h2>用欧美货架，交叉验证产品方向</h2><p>美国关注 Target / Walmart；欧洲补充 IKEA / Action。上新和榜单不是实际销量。</p></div></div><div className="retail-source-list">{['Target', 'Amazon', 'IKEA', 'Action'].map(name => <SourceBadge key={name} name={name} />)}</div></div>}
          {view === 'trends' && <><div className="content-research-notice"><Sparkles size={18} /><p>{mode === 'demo' ? '当前为示例内容拆解与示例指标，展示研究方法；不代表已采集的真实爆款。' : '原帖与指标来自团队导入。缺失数据保留为空；曝光/播放请按平台分别理解。'}<span>先看内容机制，再判断能否做成可复用、可量产的产品。</span></p></div><div className="platform-tabs" role="group" aria-label="筛选内容平台">{['all', ...SOURCES.filter(s => s.type === 'social').map(s => s.name)].map(name => <button key={name} aria-pressed={platform === name} className={platform === name ? 'selected' : ''} onClick={() => setPlatform(name)}>{name === 'all' ? '全部平台' : name}</button>)}</div></>}
          <div className="explore-toolbar"><div className="view-count"><h2>{view === 'saved' ? '我的收藏' : view === 'retail' ? '零售端趋势' : '内容 → 新品方向'}</h2><span>{visibleTrends.length} 个方向</span></div><label className="sort-select"><SlidersHorizontal size={14} /><select aria-label="趋势排序" value={sort} onChange={e => setSort(e.target.value)}><option value="score">按机会分排序</option><option value="growth">按增长幅度排序</option><option value="retail">按零售信号排序</option>{view === 'trends' && <option value="views">按曝光 / 播放排序</option>}</select><ChevronDown size={13} /></label></div>
          {view === 'trends' && sort === 'views' && <p className="cross-platform-note">曝光与播放定义因平台而异，建议选择单一平台比较。未知数据排在最后。</p>}
          {visibleTrends.length ? view === 'trends' ? contentCards(visibleTrends) : cards(visibleTrends) : view === 'saved' && !currentSaved.length ? <EmptyState title="给下一季，收藏一点灵感" description="在趋势卡片上点击收藏，值得继续研究的方向就会留在这里。" action={() => navigate('trends')} actionLabel="发现趋势" /> : <EmptyState action={resetFilters} />}
        </section>}

        {view === 'planner' && <section className="planner-view">
          <SeasonalCalendar quarter={quarter} anchor={anchor} timing={timing} onTimingChange={setTiming} onExplore={exploreHoliday} />
          <div className="planning-note"><Leaf size={18} /><span>以下按开发任务月份安排；目标节日是售卖节点，两者独立。旧企划可编辑补充节日与产品系列。</span><span className="planner-storage">本地自动保存<CheckCheck size={14} /></span></div>
          <div className={`plan-board ${!currentPlans.length ? 'empty-board' : ''}`}>{quarterMonths(quarter).map((month, index) => <section className="month-column" key={month}>
            <div className="month-heading"><div><span className="month-index">0{index + 1}</span><h2>{month} 月</h2><span className="month-en">{['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][month - 1]}</span></div><span className="month-count">{filteredPlans.filter(p => p.month === month).length}</span></div>
            <div className="month-purpose">{['方向调研 · 明确新品切入点', '系列开发 · 验证设计与材质', '样品复盘 · 确认系列与包装'][index]}</div>
            <div className="month-plans">{filteredPlans.filter(p => p.month === month).map(plan => <article className="plan-card" key={plan.id}>
              <div className="plan-card-top"><span>{plan.category}</span><IconButton label={`移除${plan.title}`} onClick={() => deletePlan(plan)}><X size={14} /></IconButton></div>
              <button className="title-button" onClick={() => setEditor({ existing: plan })}><h3>{plan.title}</h3><ArrowUpRight size={15} /></button>
              <div className="plan-card-context"><span className="holiday-tag">{HOLIDAYS[plan.festival] || '节日待确认'}</span><span>{MARKETS[plan.market] || '市场待确认'}</span></div>
              {plan.productIdea && <div className="plan-product-direction"><b>新品系列</b><p>{plan.productIdea}</p></div>}
              {plan.sampleTask && <div className="plan-product-direction"><b>打样任务</b><p>{plan.sampleTask}</p></div>}
              <p>{plan.brief || '点击选题，补充你的设计方向与下一步。'}</p>
              <div className="plan-card-bottom"><label className={`plan-status status-${STATUS.indexOf(plan.status)}`}><span /><select aria-label={`${plan.title}当前阶段`} value={plan.status} onChange={e => setPlans(old => old.map(p => p.id === plan.id ? { ...p, status: e.target.value } : p))}>{STATUS.map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={11} /></label><button className="text-button" onClick={() => setEditor({ existing: plan })}>编辑</button></div>
            </article>)}<button className="add-month-plan" onClick={() => setEditor({ existing: { title: '', month, status: '待调研', brief: '' } })}><Plus size={16} />添加设计选题</button></div>
          </section>)}</div>
          {!currentPlans.length && <div className="planner-start"><Sparkles size={19} /><div><h3>把一条内容线索，变成一个新品系列</h3><p>在社媒内容卡片点击「加入企划」，连同产品方向、节日和打样任务一起保存。</p></div><button className="text-button" onClick={() => navigate('trends')}>去发现内容<ArrowRight size={16} /></button></div>}
          {query && !filteredPlans.length && <p className="planner-search-empty">没有匹配「{query}」的选题。</p>}
        </section>}

        {view === 'sources' && <SourcesView mode={mode} setMode={switchMode} imported={imported} onImport={importData} notify={notify} />}

        <footer className="page-footer"><span><Waves size={15} />观潮 TrendAtlas<span className="footer-dot">·</span>把全球趋势，变成你的下一步。</span><span>{mode === 'demo' ? 'DEMO DATA / 示例数据，非实时采集' : 'LOCAL RESEARCH / 用户导入数据'}</span></footer>
      </main>
    </div>
    {detail && <TrendDetail trend={detail} mode={mode} onClose={() => setDetail(null)} saved={saved.includes(detail.id)} onSave={toggleSave} onPlan={addPlan} planned={isPlanned(detail)} />}
    {editor && <PlanEditor trend={editor.trend} existing={editor.existing} quarter={quarter} mode={mode} onSave={savePlan} onClose={() => setEditor(null)} />}
    {exportOpen && <Modal title="把研究带进下一次讨论" eyebrow="EXPORT YOUR RESEARCH" onClose={() => setExportOpen(false)}><p className="modal-copy">CSV 文件可在 Excel、Numbers 或飞书表格中打开，保留来源、观察日期与数据性质。</p><div className="export-options"><button onClick={exportTrends} disabled={!visibleTrends.length}><div className="export-icon"><BarChart3 size={24} /></div><div><strong>趋势研究简报</strong><span>当前页面筛选结果 · {visibleTrends.length} 条记录</span></div><ArrowDownToLine size={18} /></button><button onClick={exportPlan} disabled={!filteredPlans.length}><div className="export-icon"><Layers3 size={24} /></div><div><strong>{quarter.replace('-', ' ')} 设计企划</strong><span>当前季度{query ? '搜索结果' : '全部选题'} · {filteredPlans.length} 个设计方向</span></div><ArrowDownToLine size={18} /></button></div><div className="method-note">{provenanceText(mode)}。导出会保留此标记，避免把演示指标当作市场结论。</div></Modal>}
    {help && <Modal title="让趋势，真正服务于设计" eyebrow="A SMALL GUIDE TO WHAT’S NEXT" onClose={() => setHelp(false)} wide><div className="guide-steps"><section><span>01</span><div><h3>看信号，而不只看热度</h3><p>先筛选市场与品类，再结合社媒热度、零售观察和持续增长筛选方向。当前演示数据固定在 2026 年 11 月，切换时间范围以该日期为基准；导入数据以今天为基准。</p></div></section><section><span>02</span><div><h3>用可解释的指标做判断</h3><p>社媒热度与零售信号均为 0–100 的研究指数。机会分按 45% 社媒 + 35% 零售 + 20% 正向增长计算；增长低于 0 时按 0、高于 100 时按 100 计分。高潜力门槛为 75 分。上架与榜单信号并非销量。</p></div></section><section><span>03</span><div><h3>把趋势变成具体的设计动作</h3><p>收藏值得追踪的方向，点击「加入企划」安排季度选题。按月份安排调研、设计与打样任务，导出 CSV 后与团队讨论。</p></div></section></div><div className="data-disclosure"><Database size={18} /><span>当前尚未连接海外平台。演示指标为构造数据，配图为风格参考。真实业务请导入有依据的调研记录，或在确认品类、国家与数据权限后接入采集服务。</span></div><div className="modal-actions"><button className="button primary" onClick={() => { setHelp(false); navigate('sources'); }}>查看数据来源<ArrowRight size={15} /></button></div></Modal>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span><span>{toast.message}</span>{toast.undo && <button onClick={() => { toast.undo(); setToast(null); }}>撤销</button>}{toast.action && <button onClick={() => { toast.action.run(); setToast(null); }}>{toast.action.label}<ArrowRight size={13} /></button>}<IconButton label="关闭提示" onClick={() => setToast(null)}><X size={14} /></IconButton></div>}
  </div>;
}
