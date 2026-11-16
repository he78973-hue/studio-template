import { products, variantsFor } from '../data.js';

const colorAliases = { '琥珀红': '热粉', '天空蓝': '天蓝', '云白': '白色' };

// Reconcile persisted bags with the current catalog, retaining size and quantity.
// Prices and images come from catalog data, never the editable stored snapshot.
export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  const lines = new Map();
  for (const item of value) {
    if (!item || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    const product = products.find(p => p.id === item.id);
    if (!product || !product.sizes.includes(item.size)) continue;
    const color = colorAliases[item.color] || item.color;
    const variants = variantsFor(product);
    const variant = variants.find(v => v.label === color) || variants[0];
    const key = `${product.id}:${variant.label}:${item.size}`;
    const quantity = Math.min(99, item.quantity + (lines.get(key)?.quantity || 0));
    lines.set(key, {
      key, id: product.id, name: product.name, price: product.price,
      src: variant.src, filter: variant.filter || '', color: variant.label,
      size: item.size, quantity,
    });
  }
  return [...lines.values()];
}

export const paymentMethods = [
  { id: 'wechat', label: '微信支付', icon: 'phone' },
  { id: 'alipay', label: '支付宝', icon: 'wallet' },
];

export function checkoutTotal(cart) {
  return cart.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
}

export function validateCheckout(draft) {
  const errors = {};
  if (!draft.recipient.trim()) errors.recipient = '请填写收货人姓名。';
  if (!/^1[3-9]\d{9}$/.test(draft.phone.replace(/\s|-/g, ''))) errors.phone = '请填写正确的 11 位大陆手机号。';
  if (draft.region.trim().length < 2) errors.region = '请填写省、市和区县。';
  if (draft.address.trim().length < 5) errors.address = '请补充街道和门牌号，至少 5 个字。';
  if (!paymentMethods.some(method => method.id === draft.method)) errors.method = '请选择一种支付方式。';
  return errors;
}
