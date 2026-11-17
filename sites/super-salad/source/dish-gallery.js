import './dish-gallery.css';
import { motionPreference, readMotion, pulseCount, revealContent } from './motion.js';

const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
const twoDigits = (value) => String(value).padStart(2, '0');

function foodArt(product) {
  const presentation = product.category === 'drink' ? 'glass' : product.cutout ? 'cutout' : 'plate';
  return `<span class="dish-art art-${product.id} art-${presentation}"><img src="${product.galleryImage || product.image}" alt="" width="600" height="600" decoding="sync" draggable="false" /></span>`;
}

function dishButton(product, index) {
  return `<button class="dish-trigger" data-dish="${product.id}" aria-label="查看${product.name}的食材与介绍，${product.price}元" aria-haspopup="dialog" aria-controls="dish-dialog">
    <span class="dish-visual">${foodArt(product)}</span>
    <span class="dish-caption"><span class="dish-caption-name">${product.name}</span><span class="dish-caption-price">¥${product.price}</span>${icon('arrow-up')}</span>
    <span class="dish-index" aria-hidden="true">${twoDigits(index + 1)} / ${product.english}</span>
    <span class="dish-quantity" data-dish-quantity="${product.id}" hidden></span>
  </button>`;
}

function receiptContent(product, index, category) {
  const ingredients = product.category === 'drink' ? ['鲜橙原汁'] : product.ingredients.split(' · ');
  const credit = product.credit;
  const imageCredit = credit ? `<p class="receipt-photo-credit">图片：<a href="${credit.source}" target="_blank" rel="noopener noreferrer">${credit.author}</a> · ${credit.licenseUrl ? `<a href="${credit.licenseUrl}" target="_blank" rel="noopener noreferrer">${credit.license}</a>` : credit.license}<br /><span>${credit.title} · 已裁切压缩</span></p>` : '';
  return `<header class="receipt-brand"><strong>SUPER SALAD</strong><span>超级沙拉 · 新鲜食材单</span></header>
    <div class="receipt-meta"><span>NO. ${twoDigits(index + 1)}</span><span>${category}</span><span>FRESHLY MADE</span></div>
    <h2 id="dish-title">${product.name}</h2>
    <p class="receipt-english">${product.english}</p>
    <p class="receipt-description">${product.description}</p>
    <div class="receipt-ingredients"><h3>${product.category === 'drink' ? '这一杯，真材实料' : '这一碗，都有什么'}</h3><ul>${ingredients.map((ingredient) => `<li><span aria-hidden="true">✳</span>${ingredient}</li>`).join('')}</ul></div>
    <dl class="receipt-pairing"><dt>${product.category === 'drink' ? '规格' : '搭配酱汁'}</dt><dd>${product.dressing}</dd></dl>
    <p class="receipt-allergens">${product.details}</p>
    <div class="receipt-total"><span>新鲜一${product.unit}</span><strong>¥${product.price}<small> / ${product.unit}</small></strong></div>
    <button class="button button-pink receipt-add" data-receipt-add="${product.id}"><span>加入购物袋</span>${icon('plus')}</button>
    <p class="receipt-feedback" role="status" aria-live="polite"></p>
    <button class="receipt-return" data-close-dish>继续挑选 <span aria-hidden="true">↗</span></button>
    <div class="receipt-barcode" aria-hidden="true"></div>
    <p class="receipt-signoff">GOOD FOOD. SUPER MOOD.<br /><span>示例菜单 · 图片仅供参考</span></p>${imageCredit}`;
}

/** A native dialog with a shared-image flight and an unfolding ingredient receipt. */
export function createDishGallery({ stage, dialog, products, categories, onAdd, getQuantity, maxQuantity }) {
  const lifetime = new AbortController();
  const signal = lifetime.signal;
  const reducedMotion = motionPreference;
  let opener = null;
  let selectedProduct = null;
  let animations = [];
  let filterAnimations = [];
  let phase = 'closed';
  let version = 0;
  let pagePosition = { left: 0, top: 0 };

  function setPhase(next) {
    phase = next;
    dialog.dataset.phase = next;
    dialog.classList.toggle('is-closing', next === 'closing');
  }

  function stopAnimations() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    dialog.querySelector('.detail-photo')?.style.removeProperty('will-change');
  }

  function stopFilterAnimations() {
    filterAnimations.forEach((animation) => animation.cancel());
    filterAnimations = [];
  }

  function transformBetween(from, to) {
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  function syncBag() {
    stage.querySelectorAll('[data-dish-quantity]').forEach((badge) => {
      const quantity = getQuantity(badge.dataset.dishQuantity);
      const changed = badge.textContent !== `已选 ${quantity} 份`;
      badge.hidden = quantity === 0;
      badge.textContent = `已选 ${quantity} 份`;
      if (changed && quantity > 0) pulseCount(badge);
    });
    const button = dialog.querySelector('[data-receipt-add]');
    if (button && selectedProduct) {
      const quantity = getQuantity(selectedProduct.id);
      button.disabled = quantity >= maxQuantity;
      button.querySelector('span').textContent = quantity >= maxQuantity
        ? `已达 ${maxQuantity} 份上限` : quantity ? `再加一份 · 已选 ${quantity} 份` : '加入购物袋';
      button.setAttribute('aria-label', quantity >= maxQuantity
        ? `${selectedProduct.name}已达${maxQuantity}份上限` : `将${selectedProduct.name}加入购物袋`);
    }
  }

  function finishClose() {
    if (phase === 'closed') return;
    ++version;
    stopAnimations();
    setPhase('closed');
    opener?.classList.remove('is-selected');
    document.body.classList.remove('dish-open');
    if (dialog.open) dialog.close();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    window.scrollTo({ ...pagePosition, behavior: 'instant' });
    selectedProduct = null;
  }

  function open(product, trigger) {
    if (phase !== 'closed') return;
    const sourceRect = trigger.querySelector('.dish-visual').getBoundingClientRect();
    stopFilterAnimations();
    opener = trigger;
    selectedProduct = product;
    pagePosition = { left: window.scrollX, top: window.scrollY };
    const token = ++version;
    const index = products.indexOf(product);
    dialog.innerHTML = `<button class="detail-close icon-button" data-close-dish aria-label="关闭餐品介绍">${icon('close')}</button>
      <div class="dish-detail-layout">
        <div class="detail-visual"><div class="detail-photo">${foodArt(product)}</div><p class="detail-caption">${product.tag}<span>${product.english}</span></p></div>
        <article class="ingredient-receipt">${receiptContent(product, index, categories[product.category])}</article>
      </div>`;
    syncBag();
    setPhase('opening');
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dish-open');
    dialog.querySelector('.detail-close').focus({ preventScroll: true });
    opener.classList.add('is-selected');

    const photo = dialog.querySelector('.detail-photo');
    const receipt = dialog.querySelector('.ingredient-receipt');
    const motion = readMotion(dialog);
    if (motion.reduced || !photo.animate) {
      setPhase('open');
      return;
    }

    const targetRect = photo.getBoundingClientRect();
    photo.style.willChange = 'transform';
    const flight = photo.animate([
      { transform: transformBetween(sourceRect, targetRect) },
      { transform: 'translate(0, 0) scale(1)' },
    ], { duration: motion.enter, easing: motion.ease, fill: 'both' });
    const paper = receipt.animate([
      { clipPath: 'inset(-8px -24px 100% -24px)', transform: `translateY(${-motion.offset}px)`, opacity: 0 },
      { clipPath: 'inset(-8px -24px -30px -24px)', transform: 'translateY(0)', opacity: 1 },
    ], { duration: motion.receipt, delay: motion.delay, easing: motion.ease, fill: 'both' });
    const caption = dialog.querySelector('.detail-caption').animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion.fast, delay: motion.fast, easing: motion.ease, fill: 'both' });
    animations = [flight, paper, caption];
    Promise.all(animations.map((animation) => animation.finished)).then(() => {
      if (token !== version) return;
      stopAnimations();
      setPhase('open');
    }).catch(() => {});
  }

  function close() {
    if (phase === 'closed' || phase === 'closing') return;
    const motion = readMotion(dialog);
    if (motion.reduced) { finishClose(); return; }
    const token = ++version;
    const photo = dialog.querySelector('.detail-photo');
    const receipt = dialog.querySelector('.ingredient-receipt');
    const currentRect = photo.getBoundingClientRect();
    const paperStyle = getComputedStyle(receipt);
    const currentClip = paperStyle.clipPath;
    const currentOpacity = paperStyle.opacity;
    const currentPaperTransform = paperStyle.transform;
    const captionNode = dialog.querySelector('.detail-caption');
    const captionOpacity = getComputedStyle(captionNode).opacity;
    stopAnimations();
    setPhase('closing');
    if (!photo.animate) { finishClose(); return; }

    const baseRect = photo.getBoundingClientRect();
    const destination = opener?.querySelector('.dish-visual')?.getBoundingClientRect();
    const canReturn = destination?.width > 0 && destination.bottom > 0 && destination.top < innerHeight;
    photo.style.willChange = 'transform';
    const flight = photo.animate([
      { transform: transformBetween(currentRect, baseRect), opacity: 1 },
      { transform: canReturn ? transformBetween(destination, baseRect) : 'scale(0.96)', opacity: canReturn ? 1 : 0 },
    ], { duration: motion.exit, easing: motion.ease, fill: 'both' });
    const paper = receipt.animate([
      { opacity: currentOpacity, clipPath: currentClip, transform: currentPaperTransform },
      { opacity: 0, clipPath: currentClip, transform: `translateY(${-motion.offset}px)` },
    ], { duration: motion.fast, easing: motion.ease, fill: 'both' });
    const caption = captionNode.animate([{ opacity: captionOpacity }, { opacity: 0 }], { duration: motion.fast, easing: motion.ease, fill: 'both' });
    animations = [flight, paper, caption];
    flight.finished.then(() => { if (token === version) finishClose(); }).catch(() => {});
  }

  function settleForLayoutChange() {
    stopFilterAnimations();
    if (phase === 'closing') { finishClose(); return; }
    if (phase === 'opening') {
      ++version;
      stopAnimations();
      setPhase('open');
    }
  }

  stage.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-dish]');
    if (!trigger) return;
    const product = products.find(({ id }) => id === trigger.dataset.dish);
    if (product) open(product, trigger);
  }, { signal });

  let pointerStartedOutside = false;
  const isOutside = (target) => target === dialog || target.classList?.contains('dish-detail-layout');
  dialog.addEventListener('pointerdown', (event) => { pointerStartedOutside = isOutside(event.target); }, { signal });
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-dish]') || (pointerStartedOutside && isOutside(event.target))) {
      close();
      return;
    }
    const button = event.target.closest('[data-receipt-add]');
    if (button && selectedProduct && phase !== 'closing') {
      onAdd(selectedProduct.id);
      syncBag();
      dialog.querySelector('.receipt-feedback').textContent = `已加入购物袋 · ${selectedProduct.name} ${getQuantity(selectedProduct.id)} 份`;
      revealContent(dialog.querySelector('.receipt-feedback'));
    }
  }, { signal });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener('close', () => { if (!dialog.open && phase !== 'closed') finishClose(); }, { signal });
  window.addEventListener('resize', settleForLayoutChange, { signal });
  reducedMotion.addEventListener('change', settleForLayoutChange, { signal });

  return {
    render(filtered, { animate = false } = {}) {
      if (phase !== 'closed') finishClose();
      const previous = new Map([...stage.querySelectorAll('[data-dish]')].map((button) => [button.dataset.dish, button.getBoundingClientRect()]));
      stopFilterAnimations();
      stage.dataset.count = String(filtered.length);
      stage.innerHTML = filtered.map((product) => dishButton(product, products.indexOf(product))).join('');
      if (!filtered.length) stage.innerHTML = '<p class="dish-empty">暂时没有这个分类的餐品，试试其他美味吧。</p>';
      syncBag();
      const motion = readMotion(stage);
      if (!animate || motion.reduced || !stage.animate) return;
      // Batch measurements, then animate: no per-frame layout reads.
      const entries = [...stage.querySelectorAll('[data-dish]')].map((button) => ({ button, rect: button.getBoundingClientRect(), old: previous.get(button.dataset.dish) }));
      filterAnimations = entries.map(({ button, rect, old }, index) => button.animate([
        { opacity: old ? 1 : 0, transform: old ? `translate(${old.left - rect.left}px, ${old.top - rect.top}px)` : `translateY(${motion.offset}px)` },
        { opacity: 1, transform: 'translate(0, 0)' },
      ], { duration: motion.content, delay: old ? 0 : Math.min(index, 4) * motion.stagger, easing: motion.ease, fill: 'backwards' }));
      const current = filterAnimations;
      Promise.all(current.map((animation) => animation.finished)).then(() => {
        if (filterAnimations === current) filterAnimations = [];
      }).catch(() => {});
    },
    syncBag,
    destroy() {
      finishClose();
      stopFilterAnimations();
      lifetime.abort();
    },
  };
}
