import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { ProductImage } from './Showroom';
import { money, variantsFor } from '../data';
import { Button, IconButton, QuantityControl } from './Controls';

export default function ProductDetail({ product, onClose, onNext, onAdd }) {
  const variants = variantsFor(product);
  const [color, setColor] = useState(() => Math.max(0, variants.findIndex(v=>v.tone === product.tone)));
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : '');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [sizeGuide, setSizeGuide] = useState(false);
  const timer = useRef();
  const closeRef = useRef();
  const variant = variants[color];
  useEffect(() => {
    const frame = requestAnimationFrame(()=>closeRef.current?.focus({ preventScroll: true }));
    return () => { clearTimeout(timer.current); cancelAnimationFrame(frame); };
  }, []);
  function add() {
    if (!size) { setError('先选一个适合你的尺码。'); return; }
    onAdd({ product, variant, size, quantity });
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(()=>setAdded(false), 2000);
  }
  return <section className={`product-focus focus-${product.category}`} aria-labelledby="product-title">
    <Button ref={closeRef} variant="inverse" icon="arrowLeft" iconPosition="start" className="back-to-rack" onClick={onClose}>返回展厅 <span className="mono key-hint">ESC</span></Button>
    <div className="focus-art">
      <span className="focus-catalog mono">ROAM EQUIPMENT / {product.id.toUpperCase()}</span>
      <span className="focus-circle" aria-hidden="true"/>
      <ProductImage product={product} variant={variant} />
      <div className="focus-product-nav"><IconButton icon="arrowLeft" tone="inverse" aria-label="上一件装备" onClick={()=>onNext(-1)}/><span className="mono">EXPLORE THE COLLECTION</span><IconButton icon="arrowRight" tone="inverse" aria-label="下一件装备" onClick={()=>onNext(1)}/></div>
    </div>
    <div className="product-panel">
      <div className="product-panel-content">
      <div className="panel-eyebrow"><span className="eyebrow">{product.tag}</span><IconButton icon="close" className="panel-close" aria-label="关闭商品详情" onClick={onClose}/></div>
      <h1 id="product-title">{product.name}</h1><p className="product-en mono">{product.en}</p>
      <div className="price-row"><strong>{money(product.price)}</strong><span>含税 · 免费配送</span></div>
      <p className="product-description">{product.description}</p>
      <div className="product-specs"><span><Icon name={product.icon} size={16}/>{product.feature}</span><span><Icon name="feather" size={16}/>{product.weight}</span></div>
      <div className="product-config-row">
        <fieldset className="color-field"><legend>颜色 <span>{variant.label}</span></legend><div className="swatch-list">{variants.map((v, i)=><button key={v.label} className={`color-swatch ${color === i ? 'selected' : ''}`} aria-label={v.label} aria-pressed={color === i} onClick={()=>{setColor(i);setAdded(false);}}><span className={`color-chip swatch-${v.tone}`}/>{color === i && <span className="swatch-check"><Icon name="check" size={10}/></span>}</button>)}</div></fieldset>
        <div className="quantity-row"><span>数量</span><QuantityControl value={quantity} max={9} onChange={next=>{setQuantity(next);setAdded(false);}}/></div>
      </div>
      <fieldset className="size-field"><legend><span>{product.category === 'packs' ? '容量' : '尺码'} <span>{size || '请选择'}</span></span>{product.sizes.length > 1 && <Button variant="text" className="size-guide-trigger" onClick={()=>setSizeGuide(!sizeGuide)} aria-expanded={sizeGuide}>尺码参考</Button>}</legend>
        {sizeGuide && <p className="size-guide">{product.category === 'shoes' ? 'EU 欧码。日常尺码为参考；厚袜或宽脚建议选大一码。' : 'S：160–170cm · M：170–175cm · L：175–180cm · XL：180–190cm。偏宽松版型，身高仅供参考。'}</p>}
        <div className="size-list">{product.sizes.map(s=><button className={`size-option ${s === size ? 'selected' : ''}`} key={s} aria-pressed={s === size} onClick={()=>{setSize(s);setError('');setAdded(false);}}>{s}</button>)}</div>
      </fieldset>
      </div>
      <div className="product-panel-footer">
      {error && <p className="field-error" role="alert">{error}</p>}
      <Button variant="primary" className={`product-purchase ${added ? 'is-added' : ''}`} icon={added ? 'check' : 'arrowUpRight'} onClick={add}>{added ? '已放入购物袋' : '加入购物袋'}</Button>
      <span className="sr-only" role="status">{added ? `${product.name}已加入购物袋` : ''}</span>
      <p className="shipping-note"><Icon name="check" size={13}/> 好好穿，慢慢走。让装备陪你更久。</p>
      </div>
    </div>
  </section>;
}
