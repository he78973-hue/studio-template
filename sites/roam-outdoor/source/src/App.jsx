import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Brand from './components/Brand';
import Icon from './components/Icon';
import Showroom from './components/Showroom';
import ProductDetail from './components/ProductDetail';
import Overlay from './components/Overlay';
import { categories, byCategory } from './data';
import { normalizeCart } from './lib/checkout';
import { Button, IconButton } from './components/Controls';

const cartKey = 'roam-shopping-bag-v1';
function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return normalizeCart(stored);
  } catch { return []; }
}

export default function App() {
  const [category, setCategory] = useState('clothing');
  const [selected, setSelected] = useState(null);
  const [offset, setOffset] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const [cart, setCart] = useState(loadCart);
  const [announcement, setAnnouncement] = useState('');
  const transition = useRef(null);
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const count = cart.reduce((n,i)=>n+i.quantity,0);

  useEffect(()=>{
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = ()=>{reduced.current = media.matches; if(media.matches) transition.current?.skipTransition();};
    media.addEventListener('change',update);
    const visibility = () => { if(document.hidden) transition.current?.skipTransition(); };
    document.addEventListener('visibilitychange', visibility);
    return ()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{try { localStorage.setItem(cartKey,JSON.stringify(cart)); } catch { setAnnouncement('购物袋已更新；当前浏览器无法保存，下次打开时会重置。'); }},[cart]);
  useEffect(()=>{
    const handler = e=>{
      if(overlay || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if(e.key === 'Escape' && selected) closeProduct();
      if(e.target === document.body && selected && e.key === 'ArrowRight') nextProduct(1);
      if(e.target === document.body && selected && e.key === 'ArrowLeft') nextProduct(-1);
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[selected,category,overlay]);

  function changeView(update) {
    transition.current?.skipTransition();
    if(document.startViewTransition && !reduced.current && !document.hidden) {
      const t = document.startViewTransition(()=>flushSync(update));
      transition.current = t;
      t.ready.catch(()=>{});
      t.finished.catch(()=>{}).finally(()=>{if(transition.current===t) transition.current=null;});
      return t.updateCallbackDone;
    }
    flushSync(update);
    return Promise.resolve();
  }
  function changeCategory(id) {
    if(id === category && !selected) return;
    changeView(()=>{setCategory(id);setSelected(null);});
    setAnnouncement(`已进入${categories.find(c=>c.id===id).label}展区`);
  }
  function selectProduct(product) {
    changeView(()=>setSelected(product));
  }
  function showOverlay(type) {
    transition.current?.skipTransition();
    setOverlay(type);
  }
  function closeProduct() {
    const productId = selected?.id;
    changeView(()=>setSelected(null)).then(()=>{
      const productButton = document.querySelector(`[data-product="${productId}"]:not([aria-hidden="true"])`);
      (productButton || document.querySelector(`[data-category="${category}"]`))?.focus({preventScroll:true});
    });
  }
  function nextProduct(direction) {
    const list = byCategory(category);
    const index = list.findIndex(p=>p.id===selected.id);
    changeView(()=>setSelected(list[(index+direction+list.length)%list.length]));
  }
  function step(direction) {
    const length = byCategory('clothing').length;
    changeView(()=>setOffset(o=>(o+direction+length)%length));
  }
  function addToBag({product,variant,size,quantity}) {
    const key = `${product.id}:${variant.label}:${size}`;
    setCart(items=>{
      const existing = items.find(i=>i.key===key);
      if(existing) return items.map(i=>i.key===key ? {...i,quantity:Math.min(99,i.quantity+quantity)} : i);
      return [...items,{key,id:product.id,name:product.name,price:product.price,src:variant.src,filter:variant.filter,color:variant.label,size,quantity}];
    });
    setAnnouncement(`${product.name}，${size}，${quantity}件，已加入购物袋`);
  }
  return <div className="app">
    <a className="skip-link" href="#category-dock">跳转到装备分类</a>
    <header className="site-header">
      <button className="brand-button" aria-label="ROAM 山行，进入展厅" onClick={()=>changeCategory('store')}><Brand/></button>
      <div className="header-center"><span className="header-store-label">山野装备，在线漫游。</span><span className="mono">A LITTLE CLOSER TO THE OUTSIDE.</span></div>
      <div className="header-actions"><Button variant="inverse" className="about-button" icon="arrowUpRight" onClick={()=>showOverlay('about')}>关于山行</Button><Button variant="inverse" className="bag-button" icon="bag" iconPosition="start" onClick={()=>showOverlay('bag')} aria-label={`购物袋，${count}件商品`}><span className="bag-button-label">购物袋</span><span className={`bag-count ${count ? 'has-items' : ''}`} key={count}>{String(count).padStart(2,'0')}</span></Button></div>
    </header>
    <Showroom category={category} onCategory={changeCategory} onSelect={selectProduct} offset={offset} onStep={step} focused={!!selected}>
      {selected && <ProductDetail product={selected} key={selected.id} onClose={closeProduct} onNext={nextProduct} onAdd={addToBag}/>}
    </Showroom>
    <footer className="site-footer">
      <div className="footer-left"><span className="store-live"><span className="status-dot"/> 线上山行装备店</span><span className="mono">OPEN TO THE OUTSIDE.</span></div>
      <div className="dock-container"><nav className="category-dock" id="category-dock" aria-label="装备分类">{categories.map(c=><button key={c.id} data-category={c.id} className={`dock-item ${category===c.id ? 'active' : ''}`} aria-label={c.label} aria-current={category===c.id ? 'page' : undefined} onClick={()=>changeCategory(c.id)}><Icon name={c.icon} size={18}/><span className="dock-item-label"><span>{c.label}</span><span className="dock-item-en mono" aria-hidden="true">{c.en}</span></span></button>)}<span className="dock-divider"/><IconButton icon="info" tone="bare" className="dock-info" aria-label="了解山行品牌" onClick={()=>showOverlay('about')}/></nav><span className="dock-caption">{selected ? '为下一次出发，找到合适的装备' : '切换展区 · 点击探索你的下一件装备'}</span></div>
      <div className="footer-right"><span className="mono">WANDER MORE. WORRY LESS.</span><span>轻装出发，向野而行 <Icon name="arrowUpRight" size={13}/></span></div>
    </footer>
    {overlay && <Overlay type={overlay} onClose={()=>setOverlay(null)} cart={cart} onQuantity={(key,d)=>setCart(items=>items.map(i=>i.key===key?{...i,quantity:Math.max(1,Math.min(99,i.quantity+d))}:i))} onRemove={key=>setCart(items=>items.filter(i=>i.key!==key))} onExplore={()=>{setOverlay(null);changeCategory('clothing');}} onPaymentComplete={() => { setCart([]); setAnnouncement('演示付款完成，购物袋已清空。本次没有真实扣款。'); }}/>}
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </div>;
}
