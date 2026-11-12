import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './components/icons.jsx';
import { Brand, DirectionMark } from './components/Brand.jsx';
import { sessions, STORAGE_KEY, getBookingDays, formatDate, isPastSession, seatsAvailable, loadBookings, validateBooking, getSessionDuration, filterSessions } from './booking.js';
import { SHOE_RENTAL_PRICE, ticketOptions, equipmentItems } from './venue.js';

const filters = [
  { id: 'all', label: '全部场次' }, { id: 'boulder', label: '抱石攀爬' },
  { id: 'rope', label: '绳攀体验' }, { id: 'intro', label: '新手入门' },
];
const zones = [
  { number: '01', en: 'BOULDERING', title: '抱石，让身体解题。', image: 'bouldering-gym.jpg', alt: '铺设保护垫、设有多种角度和色彩路线的室内抱石馆', tag: '最受岩友欢迎', detail: '4.5m 岩壁 / V0–V8', text: '不用绳索，用一条路线的时间，把注意力交还给身体。从第一步到最后一个岩点，每次尝试都有新解法。', category: 'boulder' },
  { number: '02', en: 'TOP ROPE', title: '绳攀，换一个视角。', image: 'climbing-rope.jpg', alt: '攀岩者在搭档保护下体验室内绳攀', tag: '教练全程保护', detail: '12m 高墙 / 5.6–5.12', text: '系好安全带，试着比上一次再高一点。在专业教练的保护下，感受高度，也找到信任自己的力量。', category: 'rope' },
  { number: '03', en: 'FIRST ASCENT', title: '初攀，从好奇开始。', image: 'climbing-footwork.jpg', alt: '攀岩鞋踩稳岩点的脚法特写', tag: '零基础也欢迎', detail: '90min 体验 / 6 人小班', text: '不需要强壮的手臂，也不用先买一身装备。教练带你认识岩点、学会落地，再完成属于你的第一条线。', category: 'intro' },
];
const amenities = [
  { icon: 'footprints', title: '装备租赁', text: `攀岩鞋 ¥${SHOE_RENTAL_PRICE}/双/次` },
  { icon: 'locker', title: '免费储物', text: '轻装上墙，更自在' },
  { icon: 'shower', title: '淋浴更衣', text: '运动后，清爽出发' },
  { icon: 'coffee', title: '岩友休息区', text: '喝口咖啡，交换 BETA' },
];

function scrollToBooking() {
  document.getElementById('booking')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

function Button({ children, variant = 'dark', className = '', icon = 'arrow-up-right', busy = false, ...props }) {
  return (
    <button className={`button button-${variant} ${className}`} aria-busy={busy || undefined} {...props}>
      <span>{children}</span>
      {(busy || icon) && <Icon name={busy ? 'loading' : icon} className={busy ? 'icon-spinning' : ''} />}
    </button>
  );
}

function SectionHeading({ index, english, title, description, children }) {
  return <div className="section-heading">
    <div><p className="eyebrow"><span>{index} /</span> {english}</p><h2>{title}</h2></div>
    {description && <p className="section-description">{description}</p>}{children}
  </div>;
}

function Header({ onBook, onReservations, count }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigationRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (menuOpen) navigationRef.current?.querySelector('a')?.focus();
  }, [menuOpen]);
  function menuKeyboard(e) {
    if (e.key === 'Escape') {
      closeMenu();
      menuButtonRef.current?.focus();
    }
  }
  return <>
    <div className="announcement">
      <span>少一点屏幕，多一点岩壁。</span>
      <span className="announcement-en">LESS SCROLL. MORE CLIMB. <Icon name="arrow-up-right" size="xs" /></span>
      <span className="concept-label">CONCEPT CLUB · 概念体验</span>
    </div>
    <header className="site-header">
      <div className="nav-wrap">
        <Brand />
        <nav ref={navigationRef} className={`navigation ${menuOpen ? 'is-open' : ''}`} id="site-navigation" aria-label="主导航" onKeyDown={menuKeyboard}>
          <a href="#about" onClick={closeMenu}>探索岩馆</a><a href="#zones" onClick={closeMenu}>攀爬空间</a>
          <a href="#first-climb" onClick={closeMenu}>新手第一攀</a><a href="#visit" onClick={closeMenu}>到馆指南</a>
          <button className="mobile-reservations" onClick={() => { closeMenu(); menuButtonRef.current?.focus(); onReservations(); }}><Icon name="ticket" />我的预约{count > 0 && `（${count}）`}</button>
        </nav>
        <div className="header-actions">
          <button className="my-bookings" onClick={onReservations} aria-label={`我的预约${count ? `，${count} 条` : ''}`}>
            <Icon name="ticket" /><span className="my-bookings-label">我的预约</span>{count > 0 && <span className="count-badge">{count}</span>}
          </button>
          <Button className="header-book" onClick={() => { closeMenu(); onBook('all'); }}>预约开攀</Button>
          <button ref={menuButtonRef} className="mobile-menu icon-button" aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? '关闭导航' : '打开导航'} onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </div>
    </header>
  </>;
}

function Hero({ onBook }) {
  return <section className="hero container" id="home" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow hero-eyebrow"><Icon name="asterisk" size="md" className="brand-accent" />城市攀岩，生活向上<span className="edition">EST. 2026</span></p>
      <h1 id="hero-title">下一站，<br /><span>向上。</span><DirectionMark className="hero-arrow" /></h1>
      <p className="hero-english">FIND YOUR<br /><em>NEXT HIGH.</em></p>
      <p className="hero-description">把日常留在地面，把可能交给岩壁。<br />无论第一次上墙，还是第一百次突破，<br className="desktop-break" />这里，总有属于你的下一个支点。</p>
      <div className="hero-buttons"><Button variant="orange" onClick={() => onBook('all')}>预约你的下一攀</Button><a className="text-link" href="#zones">先逛逛岩馆<Icon name="arrow-down" /></a></div>
      <div className="hero-note"><span className="status-dot" />新手友好<span className="note-divider" />装备可租<span className="note-divider" />一个人也能来</div>
    </div>
    <div className="hero-visual">
      <img className="hero-photo" src="./assets/climbing-move.jpg" alt="攀岩者在蓝绿色抱石墙上借助岩点完成重心转移" fetchPriority="high" />
      <div className="photo-topline"><span><span className="white-dot" />GET A GRIP. LET GO.</span><span>31° N / 121° E</span></div>
      <span className="photo-side-label">YOUR NEXT MOVE STARTS HERE</span>
      <div className="climb-sticker" aria-hidden="true"><span>NO EXPERIENCE?</span><DirectionMark /><strong>JUST TRY.</strong></div>
      <div className="hero-photo-bottom"><p>不止是攀岩。<br /><strong>是向上的日常。</strong></p><a href="#first-climb" className="round-link" aria-label="了解新手攀岩体验"><Icon name="arrow-up-right" size="md" /></a></div>
      <div className="image-caption">01 / THE WALL IS CALLING · 图库示意</div>
    </div>
  </section>;
}

function About() {
  const stats = [{ value: '1,200', unit: '㎡', text: '场馆面积' }, { value: '120', unit: '+', text: '条不同难度攀爬线路' }, { value: '12', unit: 'm', text: '绳攀岩壁高度' }, { value: '7', unit: '天', text: '每周开放' }];
  return <section className="about-band" id="about"><div className="container about-inner">
    <div className="about-intro"><span className="eyebrow">THIS IS YOUR THIRD PLACE.</span><h2>城市的另一种<br />打开方式。</h2><span className="sample-note">概念场馆 · 以下为示例配置</span></div>
    <div className="stats">{stats.map(s => <div className="stat" key={s.value}><div className="stat-number">{s.value}<span>{s.unit}</span></div><p>{s.text}</p></div>)}</div>
  </div></section>;
}

function ZoneCard({ zone, onBook }) {
  return <article className="zone-card">
    <div className={`zone-image zone-image-${zone.category}`}><img src={`./assets/${zone.image}`} alt={zone.alt} loading="lazy" /><span className="zone-tag">{zone.tag}</span><span className="zone-number">/{zone.number}</span></div>
    <div className="zone-heading"><h3>{zone.en}</h3><button className="zone-link icon-button" onClick={() => onBook(zone.category)} aria-label={`预约${zone.title.split('，')[0]}`}><Icon name="arrow-up-right" size="md" /></button></div>
    <h4>{zone.title}</h4><p>{zone.text}</p><div className="zone-meta"><span className="status-dot" />{zone.detail}</div>
  </article>;
}

function Zones({ onBook }) {
  return <section className="section container" id="zones">
    <SectionHeading index="01" english="FIND YOUR WALL" title="每一种向上，都有主场。" description="从脚离地的那一刻起，换一种方式认识自己。选一面岩壁，找到你喜欢的节奏。" />
    <div className="zone-grid">{zones.map(zone => <ZoneCard key={zone.number} zone={zone} onBook={onBook} />)}</div>
    <div className="route-note"><Icon name="refresh" size="xs" /><span>每周局部换线，让每次到来都有新的挑战。</span><span>难度循序渐进 · V0 新手起步 → V8 进阶挑战</span></div>
  </section>;
}

function FirstClimb({ onBook }) {
  const introSession = sessions.find(session => session.id === 'first-climb-am');
  return <section className="first-climb-section" id="first-climb"><div className="container first-climb-grid">
    <div className="first-climb-visual">
      <img src="./assets/climbing-footwork.jpg" alt="攀岩鞋踩住岩点，练习脚法与身体重心的动作特写" loading="lazy" />
      <div className="visual-caption"><span>YOU DON’T HAVE TO BE GREAT TO START.</span><strong>JUST<br />START.</strong></div>
      <span className="image-credit photo-origin">图库动作示意</span>
      <div className="beginner-ticket"><span>你的第一攀</span><strong><small>¥</small>{introSession.price}<small> / 人</small></strong><span>{getSessionDuration(introSession)} 分钟 · 含鞋与镁粉</span></div>
    </div>
    <div className="first-climb-copy">
      <p className="eyebrow"><span>02 /</span> YOUR FIRST ASCENT</p><h2>第一次来？<br />带上好奇心就够了。</h2>
      <p className="muted">不用先变厉害，才开始。我们把第一次上墙需要的，<br className="desktop-break" />都准备好了。你只管享受那个「原来我可以」的瞬间。</p>
      <div className="beginner-steps">{[['01', '先认识岩壁', '认识岩点与难度，学习热身和落地。'], ['02', '找到你的节奏', '从站稳第一步开始，教练陪你完成路线。'], ['03', '解锁第一次完攀', '碰到终点，击个掌。下一条，也许可以。']].map(([num, title, text]) => <div className="beginner-step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><Icon name="check" /></div>)}</div>
      <div className="coach-line"><div className="coach-monogram">岩</div><div><strong>阿岩 / 入门教练</strong><span>「动作可以慢慢学，先享受攀爬本身。」</span></div><span className="coach-sample">示例教练</span></div>
      <Button variant="orange" onClick={() => onBook('intro')}>从我的第一攀开始</Button><p className="fine-print">示例体验价 · 6 人小班 · 16 岁及以上</p>
    </div>
  </div></section>;
}

function TicketOverview() {
  return <section className="ticket-overview" id="ticket-guide" aria-labelledby="ticket-guide-title">
    <div className="practical-heading"><div><p className="eyebrow">PLAN YOUR VISIT</p><h3 id="ticket-guide-title">来一次，多少钱？</h3></div><a className="text-link" href="#equipment-guide">查看装备清单<Icon name="arrow-down" size="xs" /></a></div>
    <div className="ticket-grid">{ticketOptions.map(option => {
      const session = sessions.find(item => item.id === option.sessionId);
      const duration = getSessionDuration(session);
      return <article className="ticket-option" key={option.sessionId}>
        <h4>{option.title}</h4><p className="ticket-price"><span>¥</span><strong>{session.price}</strong><span>/ 人·次</span></p>
        <p className="ticket-duration"><Icon name="time" size="xs" />{duration % 60 === 0 ? `${duration / 60} 小时` : `${duration} 分钟`} · 按预约场次使用</p>
        <ul>{option.includes.map(item => <li key={item}><Icon name="check" size="xs" />{item}</li>)}</ul><p className="ticket-note">{option.note}</p>
      </article>;
    })}</div>
    <p className="ticket-disclaimer">本站示例价格，与下方课表一致；自由攀为 3 小时场次票，不是单日不限时票。</p>
  </section>;
}

function ScheduleRow({ session, date, bookings, onBook }) {
  const [expanded, setExpanded] = useState(false);
  const remaining = seatsAvailable(date, session, bookings);
  const past = isPastSession(date, session);
  const unavailable = remaining === 0 || past;
  return <article className={`schedule-row ${expanded ? 'expanded' : ''} ${unavailable ? 'unavailable' : ''}`}>
    <div className="schedule-main">
      <div className="session-time"><strong>{session.time}</strong><span>{session.end} 结束</span></div>
      <div className="session-name"><span className={`activity-tag tag-${session.category}`}>{session.label}</span><h3>{session.title}</h3><span className="session-level">{getSessionDuration(session)} 分钟 · {session.level}</span></div>
      <div className="session-coach"><span>{session.coach}</span><small>{session.area}</small></div>
      <div className={`session-seats ${remaining <= 2 && !unavailable ? 'few-seats' : ''}`}><span className="status-dot" />{past ? '已结束' : remaining === 0 ? '已约满' : `余 ${remaining} 位`}</div>
      <div className="session-price">¥<strong>{session.price}</strong><span> / 人</span></div>
      <Button variant="outline" disabled={unavailable} icon={unavailable ? false : 'arrow-up-right'} onClick={() => onBook(session, date)}>{past ? '已结束' : unavailable ? '已约满' : '预约'}</Button>
      <button className="expand-session icon-button" aria-label={`${expanded ? '收起' : '查看'}${session.title}详情`} aria-expanded={expanded} aria-controls={`details-${session.id}`} onClick={() => setExpanded(!expanded)}><Icon name={expanded ? 'collapse' : 'expand'} /></button>
    </div>
    <div id={`details-${session.id}`} className="session-details" hidden={!expanded}><div><span>装备准备</span><p>{session.equipment}</p></div><div><span>来之前了解</span><p>{session.requirement}</p></div></div>
  </article>;
}

function Schedule({ category, setCategory, bookings, onBook, onReservations }) {
  const [days, setDays] = useState(() => getBookingDays());
  const [date, setDate] = useState(() => getBookingDays()[1].key);
  const [period, setPeriod] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      const next = getBookingDays();
      setDays(next);
      setDate(current => next.some(d => d.key === current) ? current : next[0].key);
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const visibleSessions = filterSessions({ date, category, period, onlyAvailable, bookings });
  function resetFilters() {
    setCategory('all'); setPeriod('all'); setOnlyAvailable(false);
    document.querySelector('.filter-buttons button')?.focus();
  }
  return <section className="section schedule-section container" id="booking">
    <SectionHeading index="03" english="MAKE YOUR NEXT MOVE" title="留一点时间，给向上。"><button className="text-link desktop-reservations" onClick={onReservations}><Icon name="ticket" />查看我的预约<Icon name="arrow-up-right" /></button></SectionHeading>
    <div className="schedule-top"><p>挑一个合适的时间，剩下的，交给岩壁。</p><span className="demo-chip"><span className="status-dot" />演示课表 · 北京时间</span></div>
    <TicketOverview />
    <div className="date-picker">
      <div className="month-label"><Icon name="calendar" size="md" /><strong>{days.find(d => d.key === date)?.month}<span> 月</span></strong><span>未来 7 天</span></div>
      <div className="day-buttons" role="group" aria-label="选择预约日期">{days.map(day => <button key={day.key} className={`day-button ${date === day.key ? 'selected' : ''}`} aria-pressed={date === day.key} aria-label={`${day.month}月${day.day}日 ${day.label}`} onClick={() => setDate(day.key)}><span>{day.label}</span><strong>{String(day.day).padStart(2, '0')}</strong><span className="day-dot" /></button>)}</div>
    </div>
    <div className="schedule-filters">
      <div className="filter-buttons" role="group" aria-label="筛选攀爬项目">{filters.map(f => <button key={f.id} className={category === f.id ? 'active' : ''} aria-pressed={category === f.id} onClick={() => setCategory(f.id)}>{f.label}</button>)}</div>
      <div className="schedule-options">
        <select aria-label="筛选开场时段" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">全部开场时段</option><option value="morning">上午 · 12点前</option><option value="afternoon">下午 · 12–18点</option><option value="evening">晚间 · 18点起</option></select>
        <label className="availability-filter"><input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} /><span>只看可预约</span></label>
      </div>
    </div>
    <p className="session-count" aria-live="polite">{formatDate(date)} · {visibleSessions.length} 个场次{onlyAvailable && visibleSessions.length > 0 && ' · 均有剩余名额'}</p>
    <div className="schedule-list" aria-label="可预约场次">{visibleSessions.length ? visibleSessions.map(s => <ScheduleRow key={`${s.id}-${date}`} session={s} date={date} bookings={bookings} onBook={onBook} />) : <div className="schedule-empty"><Icon name="calendar" size="lg" /><h3>这个筛选下，暂时没有场次。</h3><p>试试其他日期或开场时段，也可以重置筛选查看当天全部场次。</p><Button variant="outline" icon="refresh" onClick={resetFilters}>重置筛选</Button></div>}</div>
    <div className="schedule-footnote"><Icon name="info" size="xs" /><p>首次到馆建议提前 20 分钟。自由攀租鞋另计；新手课含鞋与镁粉，绳攀课含鞋、安全带与教练保护。</p><span>所有价格与余位均为演示数据</span></div>
  </section>;
}

function EquipmentGuide() {
  return <section className="container equipment-guide" id="equipment-guide" aria-labelledby="equipment-guide-title">
    <div className="equipment-intro"><p className="eyebrow">PACK LIGHT. COME PREPARED.</p><h3 id="equipment-guide-title">鞋、粉、胶布、袜子，<br />来之前，一次看清。</h3><p>哪些票里包含，哪些要自己带，<br />先确认好，再轻装上墙。</p><a className="text-link" href="#ticket-guide">对照票价与包含项<Icon name="arrow-up-right" size="xs" /></a></div>
    <dl className="equipment-list">{equipmentItems.map(item => <div className="equipment-row" key={item.name}><dt>{item.name}</dt><dd><span className={`equipment-status equipment-status--${item.tone}`}>{item.status}</span></dd><dd className="equipment-description">{item.detail}</dd></div>)}</dl>
  </section>;
}

function Visit() {
  return <section className="visit-section" id="visit"><div className="container visit-grid">
    <div>
      <p className="eyebrow"><span>04 /</span> MORE THAN A CLIMB</p><h2>好好攀，<br />也好好待着。</h2><p className="visit-intro">攀不动了，就坐下来聊聊刚才那条线。<br />这里有岩壁，也有值得留下来的日常。</p>
      <div className="amenities">{amenities.map(item => <div className="amenity" key={item.icon}><Icon name={item.icon} size="md" /><div><strong>{item.title}</strong><span>{item.text}</span></div></div>)}</div>
      <div className="visit-info">
        <div><Icon name="time" /><div><h3>营业时间</h3><p>周一至周五 10:00—22:00<br />周六、周日 09:00—22:00</p></div></div>
        <div><Icon name="location" /><div><h3>上海 · 西岸概念馆</h3><p>选址灵感：徐汇滨江的工业空间<br /><span className="sample-note">概念展示，暂无实际营业地址</span></p></div></div>
      </div>
    </div>
    <div className="visit-photo"><img src="./assets/bouldering-gym.jpg" alt="采光开阔的工业风攀岩空间，配备不同角度的岩壁与厚保护垫" loading="lazy" /><div className="visit-photo-label"><span>YOUR WALL.<br />YOUR PEOPLE.</span><span className="image-credit">空间氛围参考图</span></div></div>
  </div><EquipmentGuide /></section>;
}

const faqs = [
  ['完全没有运动基础，可以来吗？', '可以。建议从「人生第一攀」或「下班后，向上走」体验课开始。攀岩也依靠脚法、平衡和路线判断，不只是手臂力量。教练会从热身、落地和基础动作开始带你练习。'],
  ['第一次来，需要带什么？', `穿便于活动的运动服，带好袜子和水，运动胶布可按个人习惯自备。新手体验含攀岩鞋与镁粉；绳攀体验含鞋、安全带与教练保护。自由攀可租鞋（示例价 ¥${SHOE_RENTAL_PRICE}/双/次），进阶课请自备攀岩鞋。建议提前 20 分钟到馆。`],
  ['镁粉、胶布和袜子都能在馆里拿吗？', equipmentItems.filter(item => item.name !== '攀岩鞋').map(item => `${item.name}：${item.detail}`).join(' ')],
  ['抱石和绳攀有什么区别？', '抱石岩壁较低，使用地面保护垫，重点是短路线中的动作和技巧；绳攀的岩壁更高，需要安全带、绳索与保护员，路线更长。两种项目都需要遵守教练指导，不在其他攀爬者下方停留。'],
  ['预约后可以取消或改时间吗？', '这是本地预约演示。你可以在「我的预约」里取消记录，再选择新的日期和时段。记录只保存在当前浏览器，不会向场馆发送，也不会产生付款。实际运营时应接入场馆的退改政策。'],
  ['小朋友可以参加吗？', '本页展示的体验课程适用于 16 岁及以上人群，未成年人需监护人陪同。更低年龄需要单独的少儿课程与适龄安排，本演示暂不提供少儿课程预约。'],
];

function FAQ() {
  return <section className="faq-section container">
    <div><p className="eyebrow"><span>05 /</span> BEFORE YOU CLIMB</p><h2>先解答，<br />再出发。</h2><p className="muted">关于第一次来，你可能还想知道。</p></div>
    <div className="faq-list">{faqs.map(([q, a], index) => <details key={q} className="faq-item"><summary><span className="faq-number">0{index + 1}</span><span>{q}</span><Icon name="expand" className="faq-plus" /><Icon name="collapse" className="faq-minus" /></summary><p>{a}</p></details>)}</div>
  </section>;
}

function Footer({ onBook }) {
  return <footer className="footer"><div className="container">
    <div className="footer-cta"><div><p>不用等准备好，从下一步开始。</p><h2>SEE YOU<br /><em>UP THERE.</em></h2></div><button className="footer-book" onClick={() => onBook('all')} aria-label="预约开攀"><DirectionMark /><span>岩壁上见</span></button></div>
    <div className="footer-main"><Brand /><p>在城市里，找到你的向上引力。</p><a href="#home" className="text-link">回到顶部<Icon name="arrow-up" /></a></div>
    <div className="footer-bottom"><span>© 2026 UPWARD CLIMBING CLUB</span><span>概念设计 · 场馆信息及预约均为演示</span><a href="./assets/SOURCES.md" target="_blank" rel="noreferrer">摄影与字体鸣谢<Icon name="arrow-up-right" size="xs" /></a></div>
  </div></footer>;
}

function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldOverflow;
      if (dialog.open) dialog.close();
      if (previous?.isConnected && !previous.matches(':disabled') && previous.getClientRects().length) previous.focus();
      else document.querySelector('.schedule-empty button, .schedule-options select')?.focus();
    };
  }, []);
  function dismissBackdrop(e) {
    if (e.target !== ref.current) return;
    const rect = e.target.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
  }
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={dismissBackdrop}>
    <div className="modal-header"><span className="eyebrow">UPWARD / 预约体验</span><button className="icon-button" onClick={onClose} aria-label="关闭弹窗"><Icon name="close" size="md" /></button></div>
    <h2 id="modal-title">{title}</h2>{children}
  </dialog>;
}

function FormError({ children }) {
  return children ? <p className="form-error" role="alert"><Icon name="alert" /><span>{children}</span></p> : null;
}

function BookingDialog({ selection, bookings, onSave, onClose }) {
  const { session, date } = selection;
  const [form, setForm] = useState({ name: '', phone: '', people: '1', agreed: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const submitting = useRef(false);
  const available = seatsAvailable(date, session, bookings);
  function change(e) {
    setForm(old => ({ ...old, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    setError('');
  }
  async function submit(e) {
    e.preventDefault();
    if (submitting.current) return;
    const message = validateBooking(form, seatsAvailable(date, session, loadBookings()));
    if (message) { setError(message); return; }
    if (isPastSession(date, session)) { setError('这个场次已经开始，请关闭弹窗选择其他时间。'); return; }
    submitting.current = true;
    setBusy(true);
    try {
      const booking = { id: `UP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, date, sessionId: session.id, people: Number(form.people), name: form.name.trim(), total: session.price * Number(form.people), createdAt: new Date().toISOString() };
      // The phone is validated for the prototype but never stored or transmitted.
      await onSave(booking);
      setReceipt(booking);
    } catch { setError('浏览器未能保存预约，请允许本地存储后重试。没有产生付款。'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal title={receipt ? '你的下一攀，已记下。' : '给下一次向上，留个位。'} onClose={onClose} className={receipt ? 'receipt-modal' : ''}>
    {receipt ? <div className="booking-success">
      <div className="success-mark"><Icon name="check" size="lg" /></div><p>演示预约已保存到当前浏览器。<br />这不是实际入场凭证，也没有产生付款。</p>
      <div className="receipt"><span className="eyebrow">YOUR NEXT ASCENT</span><h3>{session.title}</h3><p>{formatDate(date)} · {session.time}—{session.end}</p><p>{session.area} · {receipt.people} 人</p><div className="receipt-bottom"><span>{receipt.id}</span><strong>¥{receipt.total}</strong></div></div>
      <Button className="full-width" onClick={onClose}>好，岩壁上见</Button>
    </div> : <>
      <p className="modal-description">{formatDate(date)} · {session.time}—{session.end}</p>
      <div className="booking-summary"><span className={`activity-tag tag-${session.category}`}>{session.label}</span><h3>{session.title}</h3><p>{session.area} · {session.coach}</p><span className="summary-price">¥{session.price}<small> / 人</small></span></div>
      <form className="booking-form" onSubmit={submit}>
        <div className="form-row">
          <label>你的称呼<input name="name" autoComplete="given-name" placeholder="怎么称呼你" required maxLength={30} value={form.name} onChange={change} /></label>
          <label>联系手机<input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="11 位中国大陆手机号" required pattern="1[3-9][0-9]{9}" title="请填写有效的 11 位中国大陆手机号" maxLength={11} value={form.phone} onChange={change} /></label>
        </div>
        <label>一起攀的人数<select name="people" value={form.people} onChange={change}>{Array.from({ length: Math.min(available, 6) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} 人{i === 0 ? ' · 自己来，也很棒' : ''}</option>)}</select></label>
        <div className="booking-tip"><Icon name="info" /><div><strong>体验须知</strong><p>{session.equipment} {session.requirement}</p></div></div>
        <label className="checkbox-label"><input name="agreed" type="checkbox" checked={form.agreed} onChange={change} required /><span>已阅读体验须知，参与者均已满 16 岁；未成年人由监护人陪同。</span></label>
        <div className="booking-total"><span>示例合计 <small>{form.people} 人 × ¥{session.price}</small></span><strong>¥{session.price * Number(form.people)}</strong></div>
        <FormError>{error}</FormError>
        <Button type="submit" variant="orange" className="full-width" busy={busy} disabled={busy || available === 0}>{busy ? '正在保存…' : available === 0 ? '该场次已约满' : '确认演示预约'}</Button>
        <p className="form-disclaimer">合计仅含所选场次费用，现场另租装备费用不计入。<br />仅保存本地演示记录，不付款、不发送到场馆。<br />手机号仅用于表单校验，不会存储或上传。</p>
      </form>
    </>}
  </Modal>;
}

function ReservationsDialog({ bookings, onCancel, onClose }) {
  const [cancelId, setCancelId] = useState(null);
  const [error, setError] = useState('');
  function cancel(id) {
    try { onCancel(id); setCancelId(null); setError(''); }
    catch { setError('未能更新本地记录，请检查浏览器存储设置后重试。'); }
  }
  return <Modal title="我的下一攀。" onClose={onClose}>
    <p className="modal-description">当前浏览器保存的演示预约 · 共 {bookings.length} 条</p>
    {bookings.length === 0 ? <div className="empty-state"><Icon name="ticket" size="xl" /><h3>岩壁还在等你的第一步。</h3><p>选择喜欢的场次，给自己一点向上的时间。</p><Button onClick={() => { onClose(); scrollToBooking(); }}>去看看可约场次</Button></div> :
      <div className="reservation-list">{[...bookings].reverse().map(b => {
        const s = sessions.find(s => s.id === b.sessionId);
        return <article className="saved-booking" key={b.id}>
          <span className={`activity-tag tag-${s.category}`}>{s.label}</span><h3>{s.title}</h3><p>{formatDate(b.date)} · {s.time}—{s.end}</p><p>{b.people} 人 · 示例金额 ¥{b.total}</p>
          <div className="saved-booking-bottom"><small>{b.id}</small>{cancelId === b.id ? <div className="cancel-confirm"><button onClick={() => setCancelId(null)}>保留预约</button><button className="danger-text" onClick={() => cancel(b.id)}>确认取消</button></div> : <button className="text-link" onClick={() => setCancelId(b.id)}>取消预约</button>}</div>
        </article>;
      })}</div>}
    <FormError>{error}</FormError><p className="form-disclaimer">演示记录不代表实际预订，不可作为入场凭证。</p>
  </Modal>;
}

export default function App() {
  const [category, setCategory] = useState('all');
  const [bookings, setBookings] = useState(() => loadBookings());
  const [selection, setSelection] = useState(null);
  const [showReservations, setShowReservations] = useState(false);
  useEffect(() => {
    const sync = e => { if (e.key === STORAGE_KEY || e.key === null) setBookings(loadBookings()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function goBook(filter) { setCategory(filter); scrollToBooking(); }
  function saveBooking(booking) {
    const fresh = loadBookings();
    const session = sessions.find(s => s.id === booking.sessionId);
    if (booking.people > seatsAvailable(booking.date, session, fresh)) throw new Error('Capacity changed');
    const next = [...fresh, booking];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setBookings(next);
  }
  function cancelBooking(id) {
    const next = loadBookings().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setBookings(next);
  }
  return <>
    <a className="skip-link" href="#main">跳到主要内容</a>
    <Header onBook={goBook} onReservations={() => setShowReservations(true)} count={bookings.length} />
    <main id="main">
      <Hero onBook={goBook} /><About /><Zones onBook={goBook} />
      <div className="manifesto-strip" aria-hidden="true"><span>CHALK UP.</span><Icon name="asterisk" size="xl" /><span>SHOW UP.</span><Icon name="asterisk" size="xl" /><span>GO UP.</span><DirectionMark /><span>CHALK UP.</span><Icon name="asterisk" size="xl" /><span>SHOW UP.</span></div>
      <FirstClimb onBook={goBook} /><Schedule category={category} setCategory={setCategory} bookings={bookings} onBook={(session, date) => setSelection({ session, date })} onReservations={() => setShowReservations(true)} /><Visit /><FAQ />
    </main>
    <Footer onBook={goBook} />
    {selection && <BookingDialog selection={selection} bookings={bookings} onSave={saveBooking} onClose={() => setSelection(null)} />}
    {showReservations && <ReservationsDialog bookings={bookings} onCancel={cancelBooking} onClose={() => setShowReservations(false)} />}
  </>;
}
