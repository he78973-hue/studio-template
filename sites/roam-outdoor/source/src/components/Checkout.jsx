import { useRef, useState } from 'react';
import Icon from './Icon';
import { money } from '../data';
import { checkoutTotal, paymentMethods, validateCheckout } from '../lib/checkout';
import { Button } from './Controls';

const fields = [
  { name: 'recipient', label: '收货人', placeholder: '姓名', autoComplete: 'shipping name', maxLength: 40 },
  { name: 'phone', label: '手机号码', placeholder: '11 位大陆手机号', autoComplete: 'shipping tel', inputMode: 'tel', type: 'tel', maxLength: 20 },
  { name: 'region', label: '所在地区', placeholder: '省 / 市 / 区县', autoComplete: 'shipping address-level2', maxLength: 80 },
  { name: 'address', label: '详细地址', placeholder: '街道、门牌号及房间号', autoComplete: 'shipping street-address', maxLength: 200 },
];

export default function Checkout({ cart, draft, onChange, onBack, onComplete }) {
  const [errors, setErrors] = useState({});
  const formRef = useRef();
  const submitted = useRef(false);
  const total = checkoutTotal(cart);
  function update(name, value) {
    onChange({ ...draft, [name]: value });
    setErrors(previous => ({ ...previous, [name]: undefined }));
  }
  function submit(event) {
    event.preventDefault();
    if (submitted.current || !cart.length) return;
    const nextErrors = validateCheckout(draft);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      formRef.current.elements.namedItem(firstInvalid)?.focus?.();
      return;
    }
    submitted.current = true;
    onComplete({
      reference: `ROAM-DEMO-${Date.now().toString(36).toUpperCase()}`,
      total, count: cart.reduce((count, item) => count + item.quantity, 0),
      recipient: draft.recipient.trim(),
      method: paymentMethods.find(method => method.id === draft.method).label,
    });
  }
  return <form ref={formRef} className="checkout-form" onSubmit={submit} noValidate>
    <div className="checkout-scroll">
      <Button variant="text" icon="arrowLeft" iconPosition="start" className="checkout-back" onClick={onBack}>返回购物袋</Button>
      <div className="checkout-columns">
        <div className="checkout-details">
          <section className="checkout-section" aria-labelledby="shipping-title">
            <h3 id="shipping-title"><span className="mono">01</span> 收货信息</h3>
            <div className="checkout-fields">
              {fields.map(({ name, label, ...inputProps }) => <div key={name} className={`checkout-field field-${name}`}>
                <label htmlFor={`checkout-${name}`}>{label}</label>
                <input {...inputProps} id={`checkout-${name}`} name={name} value={draft[name]} onChange={event => update(name, event.target.value)} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined}/>
                {errors[name] && <p className="field-error" id={`error-${name}`} role="alert">{errors[name]}</p>}
              </div>)}
            </div>
          </section>
          <fieldset className="checkout-section payment-section">
            <legend><span className="mono">02</span> 支付方式 <span className="demo-badge">演示</span></legend>
            <div className="payment-methods">{paymentMethods.map(method => <label className={`payment-method ${draft.method === method.id ? 'selected' : ''}`} key={method.id}>
              <input type="radio" name="method" value={method.id} checked={draft.method === method.id} onChange={() => update('method', method.id)}/>
              <span className="payment-method-icon"><Icon name={method.icon} size={18}/></span><span>{method.label}</span>
              <span className="payment-radio" aria-hidden="true">{draft.method === method.id && <Icon name="check" size={12}/>}</span>
            </label>)}</div>
            {errors.method && <p className="field-error" role="alert">{errors.method}</p>}
            <p className="checkout-demo-note">演示支付不会扣款。收货信息仅用于本次页面预览。</p>
          </fieldset>
        </div>
        <section className="checkout-order" aria-labelledby="order-title">
          <h3 id="order-title">订单明细 <span className="mono">{cart.reduce((count, item) => count + item.quantity, 0)} 件</span></h3>
          <div className="checkout-items">{cart.map(item => <article className="checkout-item" key={item.key}>
            <div className="checkout-item-image"><img src={item.src} className={item.filter} alt=""/></div>
            <div><h4>{item.name}</h4><p>{item.color} / {item.size} · ×{item.quantity}</p><strong>{money(item.price * item.quantity)}</strong></div>
          </article>)}</div>
          <dl className="checkout-totals"><div><dt>商品金额</dt><dd>{money(total)}</dd></div><div><dt>标准配送</dt><dd>免费</dd></div><div className="checkout-grand-total"><dt>应付合计</dt><dd>{money(total)}</dd></div></dl>
        </section>
      </div>
    </div>
    <div className="checkout-submit"><div><span>应付金额</span><strong>{money(total)}</strong></div><Button variant="primary" className="payment-button" type="submit" icon="arrowRight" disabled={!cart.length}>确认付款（演示）</Button></div>
  </form>;
}

export function PaymentComplete({ receipt, onExplore }) {
  return <div className="payment-complete">
    <span className="payment-success-mark"><Icon name="check" size={32}/></span>
    <span className="eyebrow">READY FOR YOUR NEXT ADVENTURE</span>
    <h3>装备就位，向野出发。</h3>
    <p>演示付款已完成，{receipt.recipient}。<br/>本次没有真实扣款，也不会生成配送订单。</p>
    <dl className="receipt-details"><div><dt>演示金额</dt><dd>{money(receipt.total)}</dd></div><div><dt>支付方式</dt><dd>{receipt.method}（演示）</dd></div><div><dt>装备数量</dt><dd>{receipt.count} 件</dd></div><div><dt>演示编号</dt><dd className="mono">{receipt.reference}</dd></div></dl>
    <Button variant="primary" className="payment-button" icon="arrowUpRight" onClick={onExplore}>完成，返回展厅</Button>
  </div>;
}
