import { products, categories, MAX_QUANTITY, STORAGE_KEY, normalizeBag, getBagTotals } from './menu.js';
import { createDishGallery } from './dish-gallery.js';
import { motionPreference, readMotion, pulseCount, revealContent, observeAmbientMotion } from './motion.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
const money = (amount) => `¥${amount}`;
const grid = $('#product-grid');
const dialog = $('#bag-dialog');
const bagBody = $('#bag-body');
const bagFooter = $('#bag-footer');
const bagPanel = $('.bag-panel', dialog);
const toast = $('#toast');
let category = 'all';
let previewing = false;
let bagOpener = null;
let toastTimer;
let storageAvailable = true;
let bag = loadBag();
let bagPhase = 'closed';
let bagAnimation = null;
let bagVersion = 0;
let bagClosePromise = null;
let resolveBagClose = null;
let bagPagePosition = { left: 0, top: 0 };
const gallery = createDishGallery({
  stage: grid,
  dialog: $('#dish-dialog'),
  products,
  categories,
  maxQuantity: MAX_QUANTITY,
  getQuantity: (id) => bag[id] || 0,
  onAdd: (id) => adjustBag(id, 1),
});

function loadBag() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    try { return normalizeBag(JSON.parse(stored)); }
    catch { return {}; }
  } catch {
    storageAvailable = false;
    return {};
  }
}

function saveBag() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}

function announce(message) {
  clearTimeout(toastTimer);
  $('span', toast).textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function renderMenu(animate = false) {
  const filtered = products.filter((product) => category === 'all' || product.category === category);
  gallery.render(filtered, { animate });
  $('[data-menu-count]').textContent = String(products.length).padStart(2, '0');
  $('#filter-status').textContent = `${categories[category]}，共 ${filtered.length} 款餐品`;
}

function updateBagIndicators() {
  const { count, price } = getBagTotals(bag);
  $$('[data-bag-count]').forEach((element) => {
    const changed = element.textContent !== String(count);
    element.textContent = count;
    if (changed && count > 0) pulseCount(element);
  });
  $$('[data-bag-total]').forEach((element) => { element.textContent = money(price); });
  $$('[data-open-bag]').forEach((button) => button.setAttribute('aria-label', `打开购物袋，${count} 件商品，合计 ${price} 元`));
  $('.mobile-bag').hidden = count === 0;
  document.body.classList.toggle('has-bag', count > 0);
  $('#drawer-count').textContent = String(count).padStart(2, '0');
  gallery.syncBag();
}

function bagItem(product) {
  const quantity = bag[product.id];
  return `<article class="bag-item">
    <img class="bag-item-image ${product.cutout ? 'cutout' : ''}" src="${product.image}" alt="" width="80" height="80" />
    <div><h3>${product.name}</h3><p class="bag-item-price">${money(product.price)} / ${product.unit}</p>
      <div class="bag-item-controls">
        <div class="quantity-stepper" role="group" aria-label="${product.name}数量">
          <button data-adjust="${product.id}" data-delta="-1" aria-label="${quantity === 1 ? '移除' : '减少一份'}${product.name}">${icon('minus')}</button>
          <span aria-label="${quantity}份">${quantity}</span>
          <button data-adjust="${product.id}" data-delta="1" aria-label="增加一份${product.name}" ${quantity >= MAX_QUANTITY ? 'disabled' : ''}>${icon('plus')}</button>
        </div>
        <strong class="bag-item-total">${money(product.price * quantity)}</strong>
      </div>
    </div>
  </article>`;
}

function renderBag(focusTarget) {
  const { count, price } = getBagTotals(bag);
  $('#drawer-count').textContent = String(count).padStart(2, '0');
  if (previewing && count > 0) {
    renderPreview();
    return;
  }
  previewing = false;
  bagFooter.hidden = false;
  bagFooter.innerHTML = `<div class="total-row"><span>合计 <small id="total-quantity">共 ${count} 份</small></span><strong id="bag-total">${money(price)}</strong></div>
    <p class="order-note">当前为概念点餐体验，可预览所选餐品。</p>
    <button class="button button-pink checkout-button" id="preview-order" ${count === 0 ? 'disabled' : ''}>预览我的订单 ${icon('arrow')}</button>`;
  bagBody.innerHTML = count === 0
    ? `<div class="bag-empty"><span class="empty-emblem">${icon('bag')}</span><h3>好心情，从这一碗开始</h3><p>购物袋还是空的。<br />挑一份喜欢的，把新鲜带走。</p><button class="button button-pink" data-continue>去挑点美味 ${icon('arrow')}</button></div>`
    : `${products.filter(({ id }) => bag[id]).map(bagItem).join('')}<p class="bag-hint">每款餐品最多选择 ${MAX_QUANTITY} 份。减至 0 份即可移除。</p>${!storageAvailable ? '<p class="storage-notice" role="status">浏览器暂时无法保存购物袋，本次选择在当前页面内仍然有效。</p>' : ''}`;
  if (focusTarget) {
    const target = $(focusTarget, dialog);
    if (target && !target.disabled) target.focus({ preventScroll: true });
    else ($('[data-adjust]:not(:disabled)', bagBody) || $('[data-continue]', bagBody) || $('#close-bag')).focus({ preventScroll: true });
  }
}

function renderPreview() {
  const { count, price } = getBagTotals(bag);
  bagBody.innerHTML = `<div class="preview-heading"><span class="empty-emblem">${icon('sun')}</span><h3 id="preview-title" tabindex="-1">你的新鲜搭配，齐了。</h3><p>${count} 份好滋味，给今天加一点能量。</p></div>
    <div class="order-summary" aria-label="订单预览明细">
      ${products.filter(({ id }) => bag[id]).map((product) => `<div class="summary-line"><span>${product.name}<small>${money(product.price)} × ${bag[product.id]}</small></span><strong>${money(product.price * bag[product.id])}</strong></div>`).join('')}
      <div class="summary-line summary-total"><span>餐品合计</span><strong>${money(price)}</strong></div>
    </div>
    <p class="preview-disclaimer">这是本地订单预览，尚未向门店提交，也不会扣款。餐品、价格与图片均为展示示例。</p>
    <button class="preview-edit" id="edit-bag">返回修改餐品</button>`;
  bagFooter.hidden = false;
  bagFooter.innerHTML = `<button class="button button-pink checkout-button" data-continue>继续逛逛菜单 ${icon('arrow')}</button>`;
}

function adjustBag(id, delta, fromDrawer = false) {
  const product = products.find((item) => item.id === id);
  if (!product || ![-1, 1].includes(delta)) return;
  const previous = bag[id] || 0;
  const next = Math.max(0, Math.min(MAX_QUANTITY, previous + delta));
  if (next === previous) return;
  if (next) bag[id] = next;
  else delete bag[id];
  saveBag();
  updateBagIndicators();
  if (fromDrawer) {
    renderBag(next ? `[data-adjust="${id}"][data-delta="${delta}"]` : '[data-adjust]:not(:disabled), [data-continue]');
    $('#bag-live').textContent = next ? `${product.name}，${next} 份，合计 ${getBagTotals(bag).price} 元` : `已移除${product.name}`;
  } else {
    announce(`已加入 ${product.name}${!storageAvailable ? '（仅本次有效）' : ''}`);
  }
}

function openBag(opener) {
  if (dialog.open) return;
  const token = ++bagVersion;
  const motion = readMotion(dialog);
  bagOpener = opener;
  bagPagePosition = { left: scrollX, top: scrollY };
  previewing = false;
  renderBag();
  dialog.showModal();
  document.body.classList.add('bag-open');
  $('#close-bag').focus({ preventScroll: true });
  setBagPhase('opening');
  if (motion.reduced || !bagPanel.animate) { setBagPhase('open'); return; }
  bagPanel.style.willChange = 'transform';
  bagAnimation = bagPanel.animate([
    { transform: 'translateX(100%)' }, { transform: 'translateX(0)' },
  ], { duration: motion.enter, easing: motion.ease, fill: 'both' });
  bagAnimation.finished.then(() => {
    if (token !== bagVersion) return;
    stopBagAnimation();
    setBagPhase('open');
  }).catch(() => {});
}

function setBagPhase(next) {
  bagPhase = next;
  dialog.dataset.phase = next;
}

function stopBagAnimation() {
  bagAnimation?.cancel();
  bagAnimation = null;
  bagPanel.style.removeProperty('will-change');
}

function finishBagClose() {
  if (bagPhase === 'closed') return;
  ++bagVersion;
  stopBagAnimation();
  setBagPhase('closed');
  document.body.classList.remove('bag-open');
  previewing = false;
  if (dialog.open) dialog.close();
  const target = bagOpener && !bagOpener.hidden ? bagOpener : $('.bag-trigger');
  target?.focus({ preventScroll: true });
  window.scrollTo({ ...bagPagePosition, behavior: 'instant' });
  resolveBagClose?.();
  resolveBagClose = null;
  bagClosePromise = null;
}

function closeBag() {
  if (bagPhase === 'closed') return Promise.resolve();
  if (bagPhase === 'closing') return bagClosePromise;
  const token = ++bagVersion;
  const motion = readMotion(dialog);
  const currentTransform = getComputedStyle(bagPanel).transform;
  stopBagAnimation();
  setBagPhase('closing');
  bagClosePromise = new Promise((resolve) => { resolveBagClose = resolve; });
  const completion = bagClosePromise;
  if (motion.reduced || !bagPanel.animate) { finishBagClose(); return completion; }
  bagPanel.style.willChange = 'transform';
  bagAnimation = bagPanel.animate([
    { transform: currentTransform }, { transform: 'translateX(100%)' },
  ], { duration: motion.exit, easing: motion.ease, fill: 'both' });
  bagAnimation.finished.then(() => { if (token === bagVersion) finishBagClose(); }).catch(() => {});
  return completion;
}

function settleBagMotion() {
  if (bagPhase === 'closing') finishBagClose();
  else if (bagPhase === 'opening') {
    ++bagVersion;
    stopBagAnimation();
    setBagPhase('open');
  }
}

$$('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    if (category === button.dataset.category) return;
    category = button.dataset.category;
    $$('[data-category]').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    renderMenu(true);
  });
});

$$('[data-open-bag]').forEach((button) => button.addEventListener('click', () => openBag(button)));
$('#close-bag').addEventListener('click', closeBag);

let backdropPointerDown = false;
dialog.addEventListener('pointerdown', (event) => { backdropPointerDown = event.target === dialog; });
dialog.addEventListener('click', (event) => {
  if (bagPhase === 'closing') return;
  if (event.target === dialog && backdropPointerDown) { closeBag(); return; }
  const adjust = event.target.closest('[data-adjust]');
  if (adjust) adjustBag(adjust.dataset.adjust, Number(adjust.dataset.delta), true);
  if (event.target.closest('#preview-order')) {
    if (getBagTotals(bag).count === 0) return;
    previewing = true;
    renderBag();
    bagBody.scrollTop = 0;
    $('#preview-title').focus({ preventScroll: true });
    revealContent(bagBody);
  }
  if (event.target.closest('#edit-bag')) {
    previewing = false;
    renderBag('[data-adjust]');
    revealContent(bagBody, -1);
  }
  if (event.target.closest('[data-continue]')) {
    closeBag().then(() => $('#menu').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth' }));
  }
});

dialog.addEventListener('close', () => {
  if (!dialog.open && bagPhase !== 'closed') finishBagClose();
});
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeBag(); });
window.addEventListener('resize', settleBagMotion);
motionPreference.addEventListener('change', settleBagMotion);

// Keep an open bag consistent with edits in another tab without stealing focus.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  bag = loadBag();
  updateBagIndicators();
  if (dialog.open) {
    const focused = document.activeElement;
    const focusTarget = focused?.dataset.adjust
      ? `[data-adjust="${focused.dataset.adjust}"][data-delta="${focused.dataset.delta}"]` : null;
    renderBag(focusTarget);
    if (!document.activeElement || document.activeElement === document.body) $('#close-bag').focus();
  }
});

const sections = [$('#menu'), $('#philosophy')];
const observer = new IntersectionObserver((entries) => {
  const entry = entries.find((item) => item.isIntersecting);
  if (!entry) return;
  $$('.main-nav a').forEach((link) => link.classList.toggle('nav-current', link.hash === `#${entry.target.id}`));
}, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
sections.forEach((section) => observer.observe(section));
observeAmbientMotion($('.hero'));

renderMenu();
updateBagIndicators();
