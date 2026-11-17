import { createIcons, ArrowRight, ArrowUpRight, ArrowLeft, Mouse, Move, Pause, Play, X, Flower2 } from 'lucide';
import { GardenScene } from './scene.js';
import { chapters, sources } from './content.js';
import { stories } from './stories.js';
import { createInterfaceMotion } from './interface-motion.js';
import { assetURL } from './asset-url.js';
import './styles.css';
import './deep-styles.css';

const app = document.querySelector('#app');
const icon = (name, cls = '') => `<i data-lucide="${name}" ${cls ? `class="${cls}"` : ''} aria-hidden="true"></i>`;
const icons = { ArrowRight, ArrowUpRight, ArrowLeft, Mouse, Move, Pause, Play, X, Flower2 };
const renderIcons = () => createIcons({ icons, attrs: { 'aria-hidden': 'true' } });

if (new URLSearchParams(location.search).has('gray')) {
  if (new URLSearchParams(location.search).get('gray') === 'deep') {
    const { createDeepGrayStage } = await import('./deep-garden.js');
    createDeepGrayStage(app);
  } else {
    const { createGrayScene } = await import('./gray.js');
    createGrayScene(app);
  }
} else {
  buildExperience();
}

function buildExperience() {
  const lifecycle = new AbortController();
  const listen = (target,type,handler,options={}) => target.addEventListener(type,handler,{...options,signal:lifecycle.signal});
  const touchLayout = () => matchMedia('(pointer: coarse)').matches || innerWidth < 700;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { active: false, chapter: 0, progress: 0, ready: false, motion: !motionPreference.matches, fallback: false, story:0 };
  const lastChapter=chapters.length-1;
  app.innerHTML = `
    <div class="experience" style="--journey-progress: 0">
      <div class="scene-fallback" role="img" aria-label="莫奈《睡莲池上的桥》，绿意环绕的拱桥与漂浮着睡莲的池塘"></div>
      <div class="scene" id="garden-scene"></div>
      <div class="scene-shade"><div class="deep-shade"></div></div>
      <div class="grain"></div>
      <div class="loading-line" aria-hidden="true"></div>
      <header class="site-header">
        <button class="brand" id="brand-home" aria-label="莫奈的花园，返回首页">
          ${icon('flower-2', 'brand-mark')}
          <span><span class="brand-name">Le Jardin de Monet</span><span class="brand-caption">AN IMMERSIVE ART EXPERIENCE</span></span>
        </button>
        <nav class="header-nav" aria-label="主导航">
          <button class="nav-button is-current" id="nav-explore">画中漫游</button>
          <button class="nav-button" data-open-art>关于这幅画</button>
          <span class="nav-divider" aria-hidden="true"></span>
          <span class="language-note">EST. 1899</span>
        </nav>
      </header>
      <span class="side-note left">Claude Monet · 1840 — 1926</span>
      <span class="side-note right">GIVERNY, FRANCE · 1899</span>
      <section class="hero" aria-labelledby="hero-title">
        <p class="hero-eyebrow">一场穿越画布的漫游</p>
        <span class="hero-english" lang="fr">Un instant à Giverny</span>
        <h1 class="hero-title" id="hero-title">莫奈的花园</h1>
        <p class="hero-copy">让目光越过画框，让时间停在池畔。<br>走进 1899 年，莫奈眼中的那个夏天。</p>
        <button class="enter-button" id="enter-garden" disabled>
          <span id="enter-label">正在展开画布</span><span class="enter-circle">${icon('arrow-right')}</span>
        </button>
      </section>
      <section class="journey" aria-label="花园漫游" inert>
        <button class="return-button" id="return-home">${icon('arrow-left')}<span>回到画外</span></button>
        <div class="journey-caption" aria-live="polite" aria-atomic="true"></div>
        <p class="chapter-detail"></p>
        <div class="journey-marker" aria-hidden="true"></div>
        <div class="hotspot-anchor" id="artist-anchor" hidden><button class="scene-hotspot artist-hotspot" id="artist-story" data-story="0" hidden><span class="hotspot-ring">+</span><span class="hotspot-label">拜访莫奈<small>Meet the painter</small></span></button></div>
        <div class="hotspot-anchor" id="bridge-anchor" hidden><button class="scene-hotspot bridge-hotspot" id="bridge-story" data-story="2" hidden><span class="hotspot-ring">+</span><span class="hotspot-label">日本桥的故事<small>A bridge to Japan</small></span></button></div>
        <p class="scene-interpretation" hidden>艺术化演绎 · GIVERNY</p>
        <nav class="chapter-nav" aria-label="选择观画位置">
          ${chapters.map((chapter, i) => `<button class="chapter-button" data-chapter="${i}" ${i === 0 ? 'aria-current="step"' : ''}><span class="chapter-number">${chapter.number}</span>${chapter.name}</button>`).join('')}
        </nav>
      </section>
      <div class="bottom-line" aria-hidden="true"></div>
      <footer class="site-footer">
        <button class="artwork-caption" data-open-art aria-label="查看《睡莲池上的桥》原作与介绍">
          <img class="artwork-thumb" src="${assetURL('monet-preview.webp')}" alt="" width="38" height="47">
          <span><span class="artwork-name">《睡莲池上的桥》</span><span class="artwork-meta">Claude Monet, 1899 · The Met</span></span>
        </button>
        <div class="interaction-hint">${icon(touchLayout() ? 'move' : 'mouse')}<span id="interaction-text">移动鼠标，感受画中的呼吸</span></div>
        <div class="footer-tools">
          <p class="motion-label" id="motion-label">让风继续<small>Motion on</small></p>
          <button class="icon-button motion-button" id="toggle-motion" aria-label="暂停动态视差" aria-describedby="motion-label" aria-pressed="false">${icon('pause')}</button>
        </div>
      </footer>
      <p class="status-message" role="status"></p>
    </div>
    <dialog class="art-dialog" id="art-dialog" aria-labelledby="art-dialog-title">
      <button class="icon-button dialog-close" id="close-art" aria-label="关闭作品介绍">${icon('x')}</button>
      <div class="dialog-layout">
        <figure class="original-art">
          <img src="${assetURL('monet-garden.webp')}" alt="《睡莲池上的桥》完整原作：木桥横跨画面，睡莲和树木的倒影铺满竖幅池塘。" width="2400" height="3026">
          <figcaption>原作全貌 · 1899</figcaption>
        </figure>
        <article class="art-information">
          <p class="dialog-eyebrow">THE METROPOLITAN MUSEUM OF ART</p>
          <h2 class="dialog-title" id="art-dialog-title">睡莲池上的桥</h2>
          <p class="dialog-english">Bridge over a Pond of Water Lilies</p>
          <p class="artist-line">克劳德·莫奈 Claude Monet · 1899</p>
          <p class="art-story">莫奈既是画家，也热爱园艺。1893 年，他买下吉维尼住所附近带池塘的土地，希望创造一处既能愉悦双眼、又能入画的风景。于是，一座睡莲花园诞生了。</p>
          <p class="art-story">1899 年，他开始描绘池上木桥的十八个视图，十二幅完成于当年夏天。这幅画采用系列中少见的竖幅构图，将睡莲及其水中倒影带到观看的中心。</p>
          <dl class="art-facts"><dt>媒介</dt><dd>布面油画</dd><dt>尺寸</dt><dd>92.7 × 73.7 cm</dd><dt>馆藏</dt><dd>纽约大都会艺术博物馆</dd><dt>藏品编号</dt><dd>29.100.113</dd></dl>
          <p class="art-credit">H. O. Havemeyer Collection,<br>Bequest of Mrs. H. O. Havemeyer, 1929</p>
          <div class="source-links"><a href="${sources.met}" target="_blank" rel="noopener noreferrer">在 The Met 阅读原文 ${icon('arrow-up-right')}</a><a href="${sources.image}" target="_blank" rel="noopener noreferrer">图像来源 · CC0 ${icon('arrow-up-right')}</a></div>
          <p class="interpretation-note">文字依据 The Met 馆藏介绍整理。网页中的空间与动态是对原作的艺术化演绎。</p>
        </article>
      </div>
    </dialog>
    <dialog class="art-dialog story-dialog" id="story-dialog" aria-labelledby="story-title">
      <button class="icon-button dialog-close" id="close-story" aria-label="关闭莫奈的故事">${icon('x')}</button>
      <div class="dialog-layout story-layout">
        <figure class="story-visual"><img id="story-image" alt=""><figcaption id="story-image-caption"></figcaption><span class="story-visual-mark">Le temps de Monet</span></figure>
        <article class="story-information">
          <p class="dialog-eyebrow">在花园里，读懂莫奈</p>
          <div class="story-tabs" role="tablist" aria-label="选择莫奈的故事">
            ${stories.map((story,index)=>`<button role="tab" id="story-tab-${index}" data-story-tab="${index}" aria-controls="story-panel" aria-selected="${index===0}" tabindex="${index===0?'0':'-1'}">${story.label}</button>`).join('')}
            <span class="tab-indicator" aria-hidden="true"></span>
          </div>
          <div role="tabpanel" id="story-panel" aria-labelledby="story-tab-0" tabindex="0"></div>
        </article>
      </div>
    </dialog>
  `;
  renderIcons();
  const $ = (selector) => app.querySelector(selector);
  const experience = $('.experience');
  const dialog = $('#art-dialog');
  const storyDialog = $('#story-dialog');
  const anyDialogOpen=()=>dialog.open||storyDialog.open;
  const hero = $('.hero');
  const journey = $('.journey');
  const sceneHost = $('#garden-scene');
  let scene;
  let touch = null, inputFrame = 0, queuedProgress = null, disposed = false;
  const motion = createInterfaceMotion(app,{reduced:!state.motion});
  const onDialogChange = open => { if(open) clearInput(); scene?.setReading(anyDialogOpen()); };
  const artModal = motion.attachDialog(dialog,onDialogChange);
  const storyModal = motion.attachDialog(storyDialog,onDialogChange);
  const hotspotShown = {artist:false,bridge:false};

  function clearInput() {
    cancelAnimationFrame(inputFrame); inputFrame=0; queuedProgress=null;
    if(touch && sceneHost.hasPointerCapture(touch.id)) sceneHost.releasePointerCapture(touch.id);
    touch=null;
    scene?.setPointer(0,0);
  }

  function queueProgress(progress) {
    queuedProgress=Math.max(0,Math.min(lastChapter,progress));
    if(inputFrame)return;
    inputFrame=requestAnimationFrame(()=>{
      const value=queuedProgress;
      queuedProgress=null;inputFrame=0;
      if(value!==null&&state.active&&!anyDialogOpen())goTo(value,true);
    });
  }

  function updateMotion() {
    state.motion=state.motion&&!motionPreference.matches&&!state.fallback;
    motion.setReduced(!state.motion);
    scene?.setMotion(state.motion);
    $('#toggle-motion').innerHTML = icon(state.motion ? 'pause' : 'play');
    $('#toggle-motion').setAttribute('aria-label', state.motion ? '暂停动态视差' : '开启动态视差');
    $('#toggle-motion').setAttribute('aria-pressed', String(!state.motion));
    $('.motion-label').innerHTML = state.motion ? '让风继续<small>Motion on</small>' : '静静看画<small>Motion off</small>';
    $('#toggle-motion').disabled=state.fallback||motionPreference.matches;
    if(motionPreference.matches) {
      $('#toggle-motion').setAttribute('aria-label','系统已开启减少动态');
      $('.motion-label').innerHTML='静静看画<small>Reduced motion</small>';
    }
    renderIcons();
  }

  function updateChapter(index, force = false) {
    if (index === state.chapter && !force) return;
    state.chapter = index;
    const chapter = chapters[index];
    const titleMarkup = index === 0 ? chapter.title : chapter.title.replace('，', '，<br>');
    const caption = $('.journey-caption');
    caption.innerHTML = `<p class="chapter-eyebrow"><span>${chapter.number} / 0${chapters.length}</span><span>${chapter.english}</span></p><h2 class="chapter-title">${titleMarkup}</h2><p class="chapter-description">${chapter.text}</p>${index>=2&&index<lastChapter?`<button class="continue-journey" data-next-chapter="${index+1}">继续向花园深处 ${icon('arrow-right')}</button>`:''}${index===lastChapter?`<button class="continue-journey" data-story="0">读读莫奈的故事 ${icon('arrow-up-right')}</button>`:''}`;
    renderIcons();
    if(!force)motion.reveal(caption);
    $('.chapter-detail').textContent = chapter.detail;
    app.querySelectorAll('[data-chapter]').forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const marker = $('.journey-marker');
    marker.hidden=index>2;
    placeMarker();
    updateHint();
  }

  function placeMarker() {
    const index=Math.min(state.chapter,2),marker=$('.journey-marker');
    marker.style.setProperty('--marker-x',['64vw','60vw','66vw'][index]);
    marker.style.setProperty('--marker-y',(innerWidth<700?['28svh','29svh','31svh']:['51svh','37svh','50svh'])[index]);
  }

  function goTo(progress, continuous = false) {
    cancelAnimationFrame(inputFrame);inputFrame=0;queuedProgress=null;
    state.progress = Math.max(0, Math.min(lastChapter, progress));
    scene?.setProgress(state.progress);
    experience.style.setProperty('--journey-progress', state.progress / lastChapter);
    experience.classList.toggle('is-deep',state.active&&state.progress>2.7);
    const next=Math.round(state.progress);
    // A small deadband prevents labels flickering while a trackpad settles on
    // a chapter boundary. Direct chapter buttons still select immediately.
    if(!continuous || Math.abs(state.progress-state.chapter)>.58)updateChapter(next);
  }

  function enter() {
    if (!state.ready || state.active) return;
    clearInput();
    state.active = true;
    experience.classList.add('is-exploring');
    hero.inert = true;
    hero.setAttribute('aria-hidden', 'true');
    journey.inert = false;
    scene?.setActive(true);
    goTo(0);
    updateHint();
    $('#return-home').focus({ preventScroll: true });
  }

  function leave() {
    clearInput();
    state.active = false;
    experience.classList.remove('is-exploring');
    hero.inert = false;
    hero.removeAttribute('aria-hidden');
    journey.inert = true;
    scene?.setActive(false);
    goTo(0);
    updateHint();
    $('#enter-garden').focus({ preventScroll: true });
  }

  function openArt() {
    artModal.open();
    $('.dialog-layout').scrollTop = 0;
  }

  function renderStory(index) {
    if(index===state.story&&$('#story-panel').childElementCount&&storyDialog.open)return;
    const previousScroll=$('.story-layout').scrollTop;
    state.story=index;
    const story=stories[index];
    const panel=$('#story-panel');
    panel.setAttribute('aria-labelledby',`story-tab-${index}`);
    panel.innerHTML=`<p class="story-eyebrow">${story.eyebrow}</p><h2 class="dialog-title" id="story-title">${story.title}</h2><p class="dialog-english">${story.subtitle}</p><div class="story-prose">${story.paragraphs.map(p=>`<p>${p}</p>`).join('')}</div><dl class="story-facts">${story.facts.map(([value,label])=>`<div><dt>${value}</dt><dd>${label}</dd></div>`).join('')}</dl><div class="source-links">${story.links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ${icon('arrow-up-right')}</a>`).join('')}</div><p class="interpretation-note">${story.note}</p>`;
    $('#story-image').src=story.image;$('#story-image').alt=story.imageAlt;
    $('.story-visual').className=`story-visual ${story.imageClass}`;
    $('#story-image-caption').textContent=story.caption;
    app.querySelectorAll('[data-story-tab]').forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
    $('.story-layout').scrollTop=storyDialog.open?Math.min(previousScroll,$('.story-information').offsetTop):0;
    renderIcons();
    if(storyDialog.open){syncStoryIndicator();motion.reveal(panel,3);}
  }

  function syncStoryIndicator(animate=true) {
    if(storyDialog.open)motion.moveIndicator($('.story-tabs'),$(`[data-story-tab="${state.story}"]`),animate);
  }

  function openStory(index) {
    renderStory(index);
    storyModal.open();
    syncStoryIndicator(false);
  }

  listen($('#enter-garden'),'click', enter);
  listen($('#nav-explore'),'click', enter);
  listen($('#return-home'),'click', leave);
  listen($('#brand-home'),'click', leave);
  app.querySelectorAll('[data-open-art]').forEach((button) => listen(button,'click', openArt));
  app.querySelectorAll('[data-chapter]').forEach((button) => listen(button,'click', () => goTo(Number(button.dataset.chapter))));
  listen(journey,'click',(event)=>{
    const storyButton=event.target.closest('[data-story]');
    if(storyButton) openStory(Number(storyButton.dataset.story));
    const next=event.target.closest('[data-next-chapter]');
    if(next) goTo(Number(next.dataset.nextChapter));
  });
  listen($('#close-art'),'click',artModal.close);
  listen(dialog,'click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) artModal.close(); } });
  listen($('#close-story'),'click',storyModal.close);
  listen(storyDialog,'click',(event)=>{
    const tab=event.target.closest('[data-story-tab]');
    if(tab) renderStory(Number(tab.dataset.storyTab));
    if(event.target===storyDialog){const box=storyDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)storyModal.close();}
  });
  listen($('.story-tabs'),'keydown',(event)=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const index=event.key==='Home'?0:event.key==='End'?stories.length-1:(state.story+(event.key==='ArrowRight'?1:-1)+stories.length)%stories.length;
    renderStory(index);$(`#story-tab-${index}`).focus();
  });
  listen($('#toggle-motion'),'click', () => { state.motion = !state.motion; updateMotion(); });
  listen(motionPreference,'change', (event) => { state.motion = !event.matches; if (scene) scene.reducedMotion = event.matches; updateMotion(); });

  listen(window,'pointermove', (event) => {
    if (event.pointerType === 'touch' || anyDialogOpen() || event.target.closest('button,a')) return;
    scene?.setPointer(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
  });
  listen(document,'mouseleave', () => scene?.setPointer(0, 0));
  listen(window,'blur',clearInput);
  listen(sceneHost,'pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary || anyDialogOpen()) return;
    touch = { id:event.pointerId,x: event.clientX, y: event.clientY,progress:state.progress,axis:null };
    sceneHost.setPointerCapture(event.pointerId);
  });
  listen(sceneHost,'pointermove', (event) => {
    if (!touch || touch.id!==event.pointerId || anyDialogOpen()) return;
    const dx=event.clientX-touch.x,dy=event.clientY-touch.y;
    if(!touch.axis) {
      if(Math.hypot(dx,dy)<12)return;
      touch.axis=state.active&&Math.abs(dy)>Math.abs(dx)*1.15?'travel':'look';
    }
    if(touch.axis==='travel')queueProgress(touch.progress-dy*.0035);
    else scene?.setPointer(Math.max(-1, Math.min(1,dx/100)),Math.max(-1,Math.min(1,dy/140)));
  });
  const release = () => { if(queuedProgress!==null)goTo(queuedProgress,true);touch = null; scene?.setPointer(0, 0); };
  listen(sceneHost,'pointerup', release);
  listen(sceneHost,'pointercancel',release);
  listen(sceneHost,'lostpointercapture',release);
  listen(window,'wheel', (event) => {
    if (anyDialogOpen() || !state.ready || event.ctrlKey || event.metaKey || Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (!state.active) { if (event.deltaY > 15) enter(); return; }
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    queueProgress((queuedProgress??state.progress) + Math.max(-140, Math.min(140,pixels)) * 0.0011);
  }, { passive: false });
  listen(window,'keydown', (event) => {
    if (anyDialogOpen()) return;
    if (event.key === 'Escape' && state.active) leave();
    if (!state.active) return;
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      goTo(state.chapter + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1));
    }
  });

  updateChapter(0, true);
  updateMotion();
  function updateHint() {
    const text = state.active
      ? (state.chapter===lastChapter?'轻触画家身旁，读读莫奈的故事':touchLayout() ? '上滑走入深处 · 左右拖动环顾' : '继续滚动 · 一层层走进花园')
      : (touchLayout() ? '轻轻拖动，感受画中的呼吸' : '移动鼠标，感受画中的呼吸');
    $('.interaction-hint').innerHTML = `${icon(touchLayout() ? 'move' : 'mouse')}<span id="interaction-text">${text}</span>`;
    renderIcons();
  }
  updateHint();
  listen(window,'resize',()=>{updateHint();placeMarker();syncStoryIndicator(false);});
  const tabObserver=new ResizeObserver(()=>syncStoryIndicator(false));
  app.querySelectorAll('[data-story-tab]').forEach(button=>tabObserver.observe(button));
  document.fonts.ready.then(()=>{if(!disposed)syncStoryIndicator(false);});
  scene = new GardenScene(sceneHost, {
    reducedMotion: motionPreference.matches,
    onFrame({mix,progress,hotspots}) {
      for(const [name,minProgress] of [['artist',3.38],['bridge',2.78]]) {
        const anchor=$(`#${name}-anchor`),position=hotspots[name];
        const visible=state.active&&mix>(hotspotShown[name] ? .74 : .84)&&progress>minProgress+(hotspotShown[name] ? -.05 : .05)&&position.visible;
        hotspotShown[name]=visible;
        if(visible)anchor.style.transform=`translate3d(${(position.x*innerWidth).toFixed(2)}px,${(position.y*innerHeight).toFixed(2)}px,0)`;
        motion.showAnchor(anchor,visible);
      }
      $('.scene-interpretation').hidden=!(state.active&&mix>.7);
    },
    onReady() {
      state.ready = true;
      experience.classList.add('is-ready');
      $('#enter-garden').disabled = false;
      $('#enter-label').textContent = '走入花园';
    },
    onFailure(message) {
      state.ready = true;
      state.fallback = true;
      experience.classList.add('is-fallback');
      $('.status-message').textContent = message;
      $('#enter-garden').disabled = false;
      $('#enter-label').textContent = '阅读花园故事';
      state.motion = false;
      updateMotion();
      $('#toggle-motion').disabled = true;
    },
  });
  // Read-only diagnostics for reproducible browser acceptance checks.
  window.__garden = { inspect: () => ({ ...state, gesture:touch?.axis??null, interface:motion.inspect(), rendering: scene?.inspect() }) };
  function dispose() {
    if(disposed)return;
    disposed=true;clearInput();lifecycle.abort();tabObserver.disconnect();motion.dispose();scene?.dispose();
    delete window.__garden;
  }
  listen(window,'pagehide',event=>{if(!event.persisted)dispose();});
  if (import.meta.hot) import.meta.hot.dispose(dispose);
}
