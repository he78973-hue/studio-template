import './style.css';
import { createIcons, ArrowUpRight, ArrowLeft, ArrowRight, BookOpen, Camera, Landmark, Plus, Minus, MoveUpRight, Maximize, X, Info, Footprints, RotateCcw, Mouse, Navigation, MapPin, Route } from 'lucide';
import { places, arrivalGuide } from './places.js';
import { Coffee, Palette } from 'lucide';

if (import.meta.env.DEV) {
  window.__lushuErrors = [];
  addEventListener('error', event => window.__lushuErrors.push(event.message));
  addEventListener('unhandledrejection', event => window.__lushuErrors.push(String(event.reason)));
}

const iconSet = {ArrowUpRight, ArrowLeft, ArrowRight, BookOpen, Camera, Landmark, Plus, Minus, MoveUpRight, Maximize, X, Info, Footprints, RotateCcw, Mouse, Navigation, MapPin, Route, Coffee, Palette};
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const refreshIcons = () => createIcons({icons: iconSet, attrs: {'stroke-width': 1.6}});
let scene;
let selected = null;
const gray = new URLSearchParams(location.search).get('gray') === '1';
const app = document.querySelector('#app');
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="上海路书首页"><span class="brand-symbol">${icon('route')}</span><span>上海路书<small>SHANGHAI, ON FOOT.</small></span></a>
    <div class="edition"><span class="edition-dot"></span> 城市漫游计划 <span class="edition-divider">/</span> VOL. 001</div>
    <button class="about-button" id="about">关于这份路书 ${icon('arrow-up-right')}</button>
  </header>
  <main class="experience">
    <section class="map-stage" aria-label="交互式三维街区">
      <div id="map"></div>
      <div id="map-status" class="map-status" role="status"><span class="loading-dot"></span> 正在展开这片街区…</div>
      <div class="scene-caption"><span class="scene-dot"></span><span>真实路网 · 微缩上海</span><small>3D STREETSCAPE</small></div>
      <svg class="marker-leaders" aria-hidden="true">${places.map(p=>`<line data-leader="${p.id}"/>`).join('')}</svg>
      <div id="markers" class="markers">${places.map(p => `<button class="map-marker marker-${p.id}" data-stop="${p.id}" aria-label="在地图上探索${p.name}"><span class="marker-badge">${p.id === 'photo' ? icon('camera') : p.number}</span><span class="marker-label">${p.short}</span></button>`).join('')}</div>
      <div id="street-labels" class="street-labels" aria-hidden="true"><span data-position="185,1,-450">安 福 路<small>ANFU RD.</small></span><span data-position="108,1,-48">武 康 路<small>WUKANG RD.</small></span><span data-position="-29,1,547">淮 海 中 路<small>HUAIHAI MIDDLE RD.</small></span></div>
      <button class="postcard" id="postcard" data-stop="mansion" aria-label="探索武康大楼的历史"><span class="postcard-tape"></span><img src="./assets/wukang-mansion.jpg" alt="武康大楼的红砖街角" width="960" height="1200"><span class="postcard-caption">街角，已有百年。 ${icon('arrow-up-right')}</span><span class="postcard-date">WUKANG MANSION · 1924</span></button>
      <div class="map-tools" role="group" aria-label="地图控制"><button class="compass" id="north" aria-label="朝北查看" title="朝北查看"><span>N</span>${icon('navigation')}</button><div class="zoom-tools"><button id="zoom-in" aria-label="放大地图" title="放大">${icon('plus')}</button><button id="zoom-out" aria-label="缩小地图" title="缩小">${icon('minus')}</button></div><button id="reset" aria-label="回到路线全景" title="回到全景">${icon('maximize')}</button></div>
      <div class="map-hint">${icon('mouse')}<span class="desktop-hint">拖动旋转 <b>·</b> 滚轮缩放 <b>·</b> 点击建筑探索</span><span class="mobile-hint">单指旋转 · 双指缩放 · 点击探索</span></div>
      <div class="map-scale"><span></span><small>风格化建筑示意</small></div>
    </section>
    <aside class="story-panel" aria-label="散步路线与地点介绍">
      <section id="overview" class="overview">
        <p class="eyebrow">A WALK UNDER THE PLANE TREES</p>
        <h1>走进<br>梧桐深处<span class="title-dot">。</span></h1>
        <div class="route-name">武康路 <span>⟶</span> 安福路</div>
        <p class="intro-copy">从百年街角，到一本旧书。<br>绕过梧桐与小店，在淮海中路收尾。</p>
        <div class="route-facts"><div><strong id="distance">约 2.2</strong><span>公里主线</span></div><div><strong>${places.length}</strong><span>个停靠点</span></div><div><strong>3—4</strong><span>小时慢逛</span></div></div>
        <button class="start-button" id="start">${icon('footprints')} 从武康大楼出发 ${icon('arrow-up-right')}</button>
        <details class="arrival-guide"><summary>${icon('navigation')} 怎么到达 · 地铁与步行 ${icon('plus')}</summary>${arrivalGuide}</details>
        <div class="route-list-heading"><span>沿途，值得停一停</span><small>THE ITINERARY</small></div>
        <nav class="stop-list" aria-label="沿途地点">${places.map(p => `<button class="stop-button" data-stop="${p.id}"><span class="stop-number">${p.number}</span><span class="stop-copy"><strong>${p.id === 'photo' ? '对街，拍一张武康大楼' : p.name}</strong><small>${p.category}</small></span>${icon(p.icon)}</button>`).join('')}</nav>
        <p class="start-note">含庭院绕行约 2–3 公里 · 按地理顺序慢逛</p>
      </section>
      <section id="detail" class="detail" hidden aria-label="地点详情"></section>
    </aside>
  </main>
  <footer class="site-footer"><span class="footer-note">用脚步，收藏一座城。</span><span class="footer-location">SHANGHAI <b>31° N / 121° E</b></span><div class="map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></div></footer>
  <div class="sr-only" id="announcement" aria-live="polite"></div>
  <dialog id="credits" aria-labelledby="credits-title"><div class="dialog-top"><span class="eyebrow">BEHIND THE WALK</span><button class="icon-button" id="close-credits" aria-label="关闭关于路书">${icon('x')}</button></div><h2 id="credits-title">一条路，慢慢走。</h2><p>上海路书，把真实街道变成一片可以探索的立体街区。第一站，从安福路走到武康路。</p><h3>关于这片街区</h3><p>道路与建筑轮廓来自 OpenStreetMap，经 OpenFreeMap / OpenMapTiles 提供。武康大楼按约 30 米高度与公开照片细化，周边建筑高度、树木与立面为风格化推定。取景点与过街线路为示意。</p><p><a href="./data/streets.json" target="_blank" rel="noopener">查看本路线地理数据</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">ODbL 数据许可</a></p><h3>摄影与资料</h3><p>武康大楼摄影：<strong>Supanut Arunoprayote</strong>，2025-11-28。依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> 使用，展示时缩放与裁切。建筑师：邬达克。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:Wukang_Mansion_20251128.jpg" target="_blank" rel="noopener">Wikimedia Commons · 原图及作者 ${icon('arrow-up-right')}</a></li><li><a href="https://en.wikipedia.org/wiki/Wukang_Mansion" target="_blank" rel="noopener">武康大楼 · 历史资料 ${icon('arrow-up-right')}</a></li><li><a href="https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai" target="_blank" rel="noopener">多抓鱼 · OFFHAND PRACTICE 项目资料 ${icon('arrow-up-right')}</a></li></ul><p class="detail-note">这是一份城市探索原型。建议停留时间为编辑建议；实际步行与店铺营业信息以现场为准。</p></dialog>
`;

const overview = document.querySelector('#overview');
const detail = document.querySelector('#detail');
const panel = document.querySelector('.story-panel');
function selectStop(id) {
  const place = places.find(p => p.id === id);
  if (!place) return;
  selected = id;
  overview.hidden = true; detail.hidden = false;
  document.body.dataset.selected = id;
  document.querySelector('.scene-caption > span:nth-child(2)').textContent=id==='finish'?'淮海中路 · 行程收尾':'聚焦地标 · 周边建筑淡显';
  detail.innerHTML = `<div class="detail-top"><button class="text-button" id="back-overview">${icon('arrow-left')} 路线总览</button><span class="stop-counter">${place.number} <span>/ ${String(places.length).padStart(2,'0')}</span></span></div><div class="detail-scroll"><p class="eyebrow">${place.english}</p><h2 tabindex="-1">${place.name}</h2><p class="address">${icon('map-pin')}${place.address}</p>${id === 'mansion' ? '<div class="building-facts"><span><strong>1924</strong>建成</span><span><strong>邬达克</strong>建筑师</span><span><strong>诺曼底公寓</strong>原名</span></div>' : ''}<h3 class="detail-lead">${place.lead}</h3><p>${place.description}</p>${place.content}<a class="source-link" href="${place.source}" target="_blank" rel="noopener">${place.sourceLabel} ${icon('arrow-up-right')}</a></div><div class="detail-bottom">${place.previous?`<button class="icon-button" id="previous-stop" aria-label="上一站：${places.find(p=>p.id===place.previous).short}">${icon('arrow-left')}</button>`:''}<button class="start-button" id="next-stop">${place.next ? `<span>下一站 <b>${places.find(p => p.id === place.next).short}</b></span>${icon('arrow-right')}` : `<span>回到路线总览</span>${icon('rotate-ccw')}`}</button></div>`;
  document.querySelector('#back-overview').addEventListener('click', showOverview);
  document.querySelector('#next-stop').addEventListener('click', () => place.next ? selectStop(place.next) : showOverview());
  document.querySelector('#previous-stop')?.addEventListener('click',()=>selectStop(place.previous));
  document.querySelector('#announcement').textContent = `第 ${Number(place.number)} 站，${place.name}`;
  document.querySelectorAll('[data-stop]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stop === id)));
  panel.scrollTop = 0;
  refreshIcons();
  scene?.focus(id);
  detail.querySelector('h2').focus({preventScroll: true});
}
function showOverview() {
  selected = null;
  overview.hidden = false; detail.hidden = true;
  delete document.body.dataset.selected;
  document.querySelector('.scene-caption > span:nth-child(2)').textContent='真实路网 · 微缩上海';
  document.querySelectorAll('[data-stop]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  panel.scrollTop = 0;
  scene?.overview();
  document.querySelector('#announcement').textContent = '已回到路线总览';
  document.querySelector('#start').focus({preventScroll:true});
}
document.querySelectorAll('[data-stop]').forEach(button => button.addEventListener('click', () => selectStop(button.dataset.stop)));
document.querySelector('#start').addEventListener('click', () => selectStop(places[0].id));
document.querySelector('#reset').addEventListener('click', showOverview);
document.querySelector('#zoom-in').addEventListener('click', () => scene?.zoom(0.8));
document.querySelector('#zoom-out').addEventListener('click', () => scene?.zoom(1.25));
document.querySelector('#north').addEventListener('click', () => scene?.north());
const dialog = document.querySelector('#credits');
dialog.querySelector('h2 + p').textContent='上海路书，把真实街道变成一片可以探索的立体街区。从武康大楼出发，经过武康路与安福路，在淮海中路收尾。';
dialog.querySelector('h3 + p').textContent='道路与建筑轮廓来自 OpenStreetMap，经 OpenFreeMap / OpenMapTiles 提供。七处地标按资料进行风格化建模；新增地标落位、商店分界、高度、背面与庭院陈设为近似示意。红线为路网中心线，不含院内步行支路；主线约 2.2 公里，含逛店与院内绕行约 2–3 公里。';
dialog.insertAdjacentHTML('beforeend',`<h3>建筑实物参照</h3><p>本轮对照实物照片修正屋顶、窗型、阳台铁艺和商店入口。砖石、瓦片与橱窗色彩图案为程序化绘制；图案不是店铺当前陈列的复刻。高度、背面、庭院布局和部分地块仍为推定。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:20260209_210_Wukang_Road.jpg" target="_blank" rel="noopener">武康路210号 · Windmemories / CC BY-SA 4.0 ↗</a></li><li><a href="https://commons.wikimedia.org/wiki/File:武康路376号住宅.jpg" target="_blank" rel="noopener">武康路376号 · 建筑外观参考 ↗</a></li><li><a href="https://offhandpractice.com/Deja-Vu-Recycle-Store-Shanghai" target="_blank" rel="noopener">多抓鱼入口与材料 · OFFHAND PRACTICE ↗</a></li></ul>`);
dialog.insertAdjacentHTML('beforeend',`<h3>新增影像与资料</h3><p>武康路 210 号：Shypanda，<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>。巴金故居：Jpbowen，<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>。两图均缩放、裁切与降饱和度；巴金照片展示改编以同一许可提供。</p><ul class="source-list"><li><a href="https://commons.wikimedia.org/wiki/File:WukangRd_sh.JPG" target="_blank" rel="noopener">武康路 210 号 · 原图与署名 ↗</a></li><li><a href="https://commons.wikimedia.org/wiki/File:Ba_Jin_house,_Shanghai.JPG" target="_blank" rel="noopener">巴金故居 · 原图与署名 ↗</a></li>${places.filter(p=>['courtyard','bajin','rac','wiggle'].includes(p.id)).map(p=>`<li><a href="${p.source}" target="_blank" rel="noopener">${p.name} · 资料 ↗</a></li>`).join('')}</ul><h3>交通参考</h3>${arrivalGuide}`);
document.querySelector('#about').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-credits').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();});
refreshIcons();
document.querySelectorAll('.map-tools button').forEach(b => {b.disabled = true;});

async function initializeMap() {
try {
  const [response, {WalkScene}] = await Promise.all([fetch('./data/streets.json'), import('./scene.js')]);
  if (!response.ok) throw new Error('Map data is unavailable');
  const data = await response.json();
  scene = new WalkScene(document.querySelector('#map'), data, {gray, onSelect: selectStop});
  if (import.meta.env.DEV) window.walkScene = scene;
  document.querySelector('#map-status').hidden = true;
  document.querySelectorAll('.map-tools button').forEach(b => {b.disabled = false;});
  document.querySelector('#distance').textContent = `约 ${(data.routeLength / 1000).toFixed(1)}`;
  if (gray) document.body.classList.add('gray-mode');
  if (selected) scene.focus(selected, false);
  const markerElements = [...document.querySelectorAll('.map-marker')];
  const labels = [...document.querySelectorAll('[data-position]')];
  const compassArrow = document.querySelector('.compass svg');
  scene.onFrame = () => {
    const occupied=[];
    markerElements.forEach((element, i) => {
      const p = scene.project(scene.anchorFor(places[i].id));
      element.hidden = !p.visible || (!!selected && selected !== places[i].id);
      const leader=document.querySelector(`[data-leader="${places[i].id}"]`);
      leader.style.display=element.hidden?'none':'';
      if(element.hidden)return;
      const halfWidth = element.offsetWidth / 2;
      const height=element.offsetHeight, width=scene.container.clientWidth, bottom=scene.container.clientHeight-40;
      let x=Math.max(halfWidth+14,Math.min(width-halfWidth-60,p.x)),y=Math.max(height+58,Math.min(bottom,p.y));
      const fits=(x,y)=>!occupied.some(r=>x+halfWidth+5>r.left&&x-halfWidth-5<r.right&&y>r.top-6&&y-height<r.bottom+6);
      if(!selected&&!fits(x,y)) {
        let found=false;
        for(let distance=1;distance<12&&!found;distance++)for(const sign of [-1,1]) {
          const cy=y+sign*distance*(height+7);
          if(cy>=height+58&&cy<=bottom&&fits(x,cy)){y=cy;found=true;break;}
        }
        if(!found)for(const cx of [halfWidth+14,width-halfWidth-60])for(let cy=height+58;cy<=bottom;cy+=height+7){if(fits(cx,cy)){x=cx;y=cy;found=true;break;}if(found)break;}
      }
      occupied.push({left:x-halfWidth,right:x+halfWidth,top:y-height,bottom:y});
      element.style.left = `${x}px`; element.style.top = `${y}px`;
      leader.setAttribute('x1',p.x);leader.setAttribute('y1',p.y);leader.setAttribute('x2',x);leader.setAttribute('y2',y-3);
    });
    labels.forEach(element => {
      const p = scene.project(element.dataset.position.split(',').map(Number));
      element.style.left = `${p.x}px`; element.style.top = `${p.y}px`; element.hidden = !p.visible || !!selected;
    });
    compassArrow.style.transform = `rotate(${-scene.controls.getAzimuthalAngle() * 180 / Math.PI - 45}deg)`;
    const d = scene.camera.position.distanceTo(scene.controls.target);
    document.querySelector('#zoom-in').disabled = d <= scene.controls.minDistance + 0.5;
    document.querySelector('#zoom-out').disabled = d >= scene.controls.maxDistance - 0.5;
  };
  scene.onError = message => {
    const status = document.querySelector('#map-status'); status.hidden = false; status.classList.add('map-error'); status.textContent = message;
    document.querySelectorAll('.map-tools button').forEach(b => {b.disabled = true;});
    document.querySelector('#markers').hidden = true;
    document.querySelector('.marker-leaders').style.display='none';
  };
} catch (error) {
  const status = document.querySelector('#map-status');
  status.classList.add('map-error'); status.textContent = '三维街区暂时无法加载。你仍可点击地点阅读路书，刷新页面可重试。';
  document.querySelector('#markers').hidden = true;
  document.querySelector('#street-labels').hidden = true;
  console.warn('3D view unavailable:', error.message);
}
}
initializeMap();
