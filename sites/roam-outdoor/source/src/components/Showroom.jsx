import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { BrandMark } from './Brand';
import { categories, byCategory, money } from '../data';
import { IconButton } from './Controls';

export function ProductImage({ product, variant, transition = true, className = '' }) {
  return <img
    className={`product-image ${variant?.filter ?? product.filter ?? ''} ${className}`}
    src={variant?.src || product.src}
    alt={`${product.name} · ${variant?.label || product.color}`}
    draggable="false"
    style={transition ? { viewTransitionName: `product-${product.id}` } : undefined}
  />;
}

function Hanger() {
  return <span className="hanger" aria-hidden="true"><i className="hanger-hook"/><i className="hanger-shoulder"/></span>;
}

function ProductLabel({ product }) {
  return <span className="product-label"><span>{product.name}</span><span className="mono">{money(product.price)}</span></span>;
}

export function ClothingRack({ onSelect, offset, onStep, miniature = false }) {
  const clothes = byCategory('clothing');
  const touchStart = useRef(null);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const media = matchMedia('(max-width: 700px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <div className={`clothing-rack ${miniature ? 'mini-rack' : ''}`} onTouchStart={e => {
    const touch = e.touches[0];
    touchStart.current = e.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  }} onTouchCancel={() => { touchStart.current = null; }} onTouchEnd={e => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = e.changedTouches[0];
    if (!start || !end || miniature) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) onStep(dx > 0 ? -1 : 1);
  }}>
    <div className="rail" aria-hidden="true"/><div className="rail-leg left" aria-hidden="true"/><div className="rail-leg right" aria-hidden="true"/>
    {clothes.map((_, index) => {
      const product = clothes[(index + offset + clothes.length) % clothes.length];
      const center = index === 3;
      const outside = compact && (index < 2 || index > 4);
      return <button key={`${product.id}-${index}`} data-product={product.id} className={`garment ${center ? 'center-garment' : ''}`} style={{ '--slot': index, '--angle': `${(index-3)*-2.3}deg` }} onClick={() => onSelect(product)} aria-label={`查看${product.name}，${money(product.price)}`} aria-hidden={outside || undefined} tabIndex={outside ? -1 : 0}>
        <Hanger /><ProductImage product={product} transition={!miniature}/>
        {!miniature && <ProductLabel product={product} />}
      </button>;
    })}
  </div>;
}

export function ShelfDisplay({ category, onSelect, miniature = false }) {
  const items = byCategory(category);
  return <div className={`fixture fixture-${category} ${miniature ? 'mini-fixture' : ''}`}>
    <span className="fixture-pin top-left"/><span className="fixture-pin top-right"/>
    <span className="fixture-pin bottom-left"/><span className="fixture-pin bottom-right"/>
    <div className="shelf-grid">
      {items.map(product => <button className="shelf-item" key={product.id} data-product={product.id} onClick={() => onSelect(product)} aria-label={`查看${product.name}，${product.color}，${money(product.price)}`}>
        {category === 'caps' && <span className="peg" aria-hidden="true" />}
        <ProductImage product={product} transition={!miniature}/>
        {!miniature && <ProductLabel product={product} />}
      </button>)}
    </div>
    <div className="fixture-foot left"/><div className="fixture-foot right"/>
  </div>;
}

function StoreOverview({ onCategory }) {
  return <div className="store-overview">
    <div className="store-welcome"><span className="eyebrow"><span className="signal-dot"/> THE VIRTUAL OUTFITTER</span><h1>去山里，<br/>找到自己。</h1><p>从一件好装备开始，<br/>把日常走成旷野。</p></div>
    <div className="overview-display"><div className="overview-wall"><BrandMark /><span className="wordmark">ROAM</span><span className="mono">MADE FOR THE WAY OUT.</span></div>
      <div className="overview-stations">
        {categories.filter(c=>c.id!=='store').map((category, i) => <button className={`overview-station station-${category.id}`} key={category.id} onClick={()=>onCategory(category.id)}>
          <span className="station-image"><img src={byCategory(category.id)[i === 0 ? 3 : 0].src} alt=""/><span className="station-plinth"/></span>
          <span className="station-label"><span><span className="mono">{category.number}</span> {category.label}</span><Icon name="arrowUpRight" size={16}/></span>
        </button>)}
      </div>
    </div>
  </div>;
}

export default function Showroom({ category, onCategory, onSelect, offset, onStep, children, focused }) {
  const categoryInfo = categories.find(c => c.id === category);
  return <main className={`showroom category-${category} ${focused ? 'is-focused' : ''}`} id="showroom" aria-label="山行虚拟装备展厅">
    <div className="room-architecture" aria-hidden="true"><div className="room-wall"/><div className="room-side left"/><div className="room-side right"/><div className="room-floor"/><div className="floor-line floor-line-left"/><div className="floor-line floor-line-right"/></div>
    {!focused && category !== 'store' && <>
      <div className="room-caption"><span className="eyebrow"><span className="signal-dot"/> {categoryInfo.en} / {categoryInfo.number}</span><h1>{category === 'clothing' ? '为山野而生。' : category === 'caps' ? '让风，自由经过。' : category === 'packs' ? '装下出发的理由。' : '下一步，是山野。'}</h1><span className="caption-sub">好装备，陪你走远一点。</span></div>
      <div className="room-brand"><BrandMark/><span className="wordmark">ROAM</span><span className="mono">LESS CITY. MORE TRAIL.</span></div>
      <div className="collection-tag"><span className="mono">FIELD COLLECTION</span><span className="collection-year">2026<span>®</span></span><span className="mono">DESIGNED TO WANDER</span></div>
      <div className="exhibit-scene" key={category}>
        {category === 'clothing' ? <ClothingRack onSelect={onSelect} offset={offset} onStep={onStep}/> : <ShelfDisplay category={category} onSelect={onSelect}/>}
      </div>
      {category === 'clothing' && <div className="rack-navigation"><IconButton icon="arrowLeft" tone="inverse" onClick={()=>onStep(-1)} aria-label="向左浏览服装"/><IconButton icon="arrowRight" tone="inverse" onClick={()=>onStep(1)} aria-label="向右浏览服装"/></div>}
      <div className="room-floor-label"><span className="mono">{String(byCategory(category).length).padStart(2, '0')} PIECES · {categoryInfo.en}</span><span><span className="mini-line"/> 点击装备，近一点看</span></div>
    </>}
    {!focused && category === 'store' && <StoreOverview onCategory={onCategory}/>}
    {children}
  </main>;
}
