import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { BrandMark } from './Brand';
import { money } from '../data';
import Checkout, { PaymentComplete } from './Checkout';
import { checkoutTotal } from '../lib/checkout';
import { Button, IconButton, QuantityControl } from './Controls';

export default function Overlay({ type, onClose, cart, onQuantity, onRemove, onExplore, onPaymentComplete }) {
  const ref = useRef();
  const headingRef = useRef();
  const [stage, setStage] = useState('bag');
  const [draft, setDraft] = useState({ recipient: '', phone: '', region: '', address: '', method: 'wechat' });
  const [receipt, setReceipt] = useState(null);
  useEffect(()=>{
    const dialog = ref.current;
    dialog.showModal();
    return ()=>dialog.close();
  }, []);
  useEffect(() => { if (stage !== 'bag') headingRef.current?.focus({ preventScroll: true }); }, [stage]);
  const total = checkoutTotal(cart);
  const isCheckout = type === 'bag' && stage === 'checkout';
  const title = type === 'about' ? '我们，为什么山行。' : stage === 'checkout' ? '确认订单' : stage === 'complete' ? '演示付款完成' : '你的购物袋';
  function completePayment(result) {
    setReceipt(result);
    setStage('complete');
    onPaymentComplete();
  }
  return <dialog ref={ref} className={`overlay-dialog ${type === 'about' ? 'about-dialog' : 'bag-dialog'} ${isCheckout ? 'checkout-dialog' : ''}`} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) onClose(); }}} aria-labelledby="overlay-title">
    <div className="overlay-header"><div><span className="eyebrow">{type === 'about' ? 'THE ROAM PHILOSOPHY' : 'READY FOR THE TRAIL'}</span><h2 id="overlay-title" ref={headingRef} tabIndex={-1}>{title}{type === 'bag' && stage === 'bag' && <span className="bag-title-count">{cart.reduce((n,i)=>n+i.quantity,0)}</span>}</h2></div><IconButton icon="close" aria-label={type === 'about' ? '关闭品牌介绍' : isCheckout ? '关闭结算' : '关闭购物袋'} onClick={onClose}/></div>
    {type === 'about' ? <div className="about-content"><div className="about-wordmark"><BrandMark/><span className="wordmark">ROAM</span></div><h3>少一点城市。<br/>多一点山野。</h3><p>我们相信，户外不必是一场盛大的出发。可以是周末的一条山径，也可以是下班后，绕一点远路。</p><p>ROAM 山行为徒步爱好者而生。关注真正需要的防护、舒适的背负，和每一克值得携带的重量。装备做得简单一点，让你和自然靠近一点。</p><div className="about-values"><span><Icon name="feather"/>轻装出发</span><span><Icon name="mountain"/>向野而行</span><span><Icon name="wind"/>自在每一步</span></div><p className="prototype-note">ROAM 是一个虚拟品牌概念店。这里的商品、价格与购物袋用于体验展示。</p><Button variant="primary" icon="arrowUpRight" onClick={onExplore}>去看看装备</Button></div> : isCheckout ? <Checkout cart={cart} draft={draft} onChange={setDraft} onBack={() => { setStage('bag'); requestAnimationFrame(() => ref.current?.querySelector('.bag-checkout-button')?.focus()); }} onComplete={completePayment}/> : stage === 'complete' ? <PaymentComplete receipt={receipt} onExplore={onExplore}/> : <>
      <div className="bag-body">{cart.length ? cart.map(item=><article className="bag-item" key={item.key}><div className="bag-image"><img src={item.src} alt={item.name} className={item.filter}/></div><div className="bag-item-details"><h3>{item.name}</h3><p>{item.color} / {item.size}</p><strong>{money(item.price)}</strong><div className="bag-item-actions"><QuantityControl value={item.quantity} onChange={next => onQuantity(item.key, next - item.quantity)} label={`${item.name} ${item.color} ${item.size}`}/><Button variant="text" className="remove-item" onClick={()=>onRemove(item.key)}>移除</Button></div></div></article>) : <div className="bag-empty"><Icon name="bag" size={40}/><h3>出发前，装点好装备。</h3><p>你的购物袋还是空的。<br/>去展厅挑一件喜欢的吧。</p><Button variant="primary" icon="arrowUpRight" onClick={onExplore}>探索装备</Button></div>}</div>
      {cart.length > 0 && <div className="bag-summary"><div><span>商品合计</span><strong>{money(total)}</strong></div><p>含税 · 标准配送免费</p><Button variant="primary" icon="arrowRight" className="bag-checkout-button" onClick={() => setStage('checkout')}>去结算</Button><Button variant="secondary" className="bag-continue" onClick={onClose}>继续逛逛</Button></div>}
    </>}
  </dialog>;
}
