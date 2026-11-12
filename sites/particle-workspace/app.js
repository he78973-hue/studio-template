/* Particle prototype. Local-first state; no cloud or model calls are simulated. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const hydrateIcons = () => window.lucide?.createIcons({attrs:{'aria-hidden':'true',focusable:'false'}});
  const safeURL = value => { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  const hostname = value => { try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return '本地文件'; } };
  const isImageSource = value => /^(assets\/|data:image\/(png|jpeg|webp|gif|avif|svg\+xml);base64,)/.test(value || '') || !!safeURL(value);
  const dateLabel = value => new Date(value).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}).replace('/', '.');
  const byteLabel = n => n ? n > 1048576 ? `${(n/1048576).toFixed(1)} MB` : `${Math.round(n/1024)} KB` : '示例素材';
  const modal = $('#modal');
  // Copies under different template paths must not share a visitor's library.
  // Directory and explicit index.html entry points resolve to the same namespace.
  const storagePath = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  const repository = new ParticleStore(`particle-workspace:${storagePath}`);
  let data, route = 'workspace', activeProject = '', tagFilter = '', typeFilter = 'all', query = '', view = 'grid', sort = 'newest', searchScope = 'current';
  let selectedAsset = '', importTab = 'file', editor = null, lastFocus = null, dragCounter = 0, modalKind = '';
  let persistent = true, saving = 0, heroObserver, heroFrame;
  let initialized = false, writeChain = Promise.resolve(), refreshing = false;
  const failedWrites = new Map(), fieldDrafts = new Map();
  const backupState = {busy:false,result:null,bundle:null,report:null,error:'',progress:'',filename:''};
  const SEEDS = [
    {id:'mori',name:'Mori · 自然生活品牌视觉',src:'assets/brand-study.svg',kind:'image',format:'SVG',tags:['品牌设计','自然'],project:'brand',height:194,width:900,imageHeight:720},
    {id:'space',name:'留白之间 · 空间与光',src:'assets/architecture.jpg',kind:'image',format:'JPG',tags:['空间','极简'],project:'brand',height:245,width:1000,imageHeight:667,source:'https://unsplash.com/photos/1600210492486-724fe5c67fb0'},
    {id:'dune',name:'荒野的形状与温度',src:'assets/desert.jpg',kind:'image',format:'JPG',tags:['摄影','自然'],project:'daily',height:194,width:1000,imageHeight:667,source:'https://unsplash.com/'},
    {id:'type',name:'Less, but better. 字体实验',src:'assets/type-study.svg',kind:'image',format:'SVG',tags:['字体排版','极简'],project:'brand',height:276,width:900,imageHeight:1050},
    {id:'flowers',name:'春日花事 · 自然色彩采集',src:'assets/flower.jpg',kind:'image',format:'JPG',tags:['摄影','自然'],project:'daily',height:235,width:1000,imageHeight:667,source:'https://unsplash.com/'},
    {id:'form',name:'Between · 线与秩序',src:'assets/form-study.svg',kind:'image',format:'SVG',tags:['图形设计','灵感实验'],project:'daily',height:249,width:900,imageHeight:880},
    {id:'quiet',name:'The Quiet Edit · 网页灵感',src:'assets/web-study.svg',kind:'link',format:'URL',tags:['网页设计','极简'],project:'web',height:208,url:'https://www.awwwards.com/',coverNote:'自主设计的网页风格封面'},
    {id:'chair',name:'一把椅子 · 日常设计',src:'assets/chair.jpg',kind:'image',format:'JPG',tags:['产品设计','极简'],project:'brand',height:245,width:1000,imageHeight:1500,source:'https://unsplash.com/'},
    {id:'figma',name:'Figma · 设计系统资源',src:'assets/form-study.svg',kind:'link',format:'URL',tags:['设计系统','网页设计'],project:'web',height:205,url:'https://www.figma.com/community',coverNote:'图形研究封面'},
    {id:'interior',name:'安静的角落 · 室内灵感',src:'assets/interior.jpg',kind:'image',format:'JPG',tags:['空间','自然'],project:'daily',height:228,width:1000,imageHeight:667,source:'https://unsplash.com/'},
    {id:'ocean',name:'蓝色时刻 · 海的肌理',src:'assets/ocean.jpg',kind:'image',format:'JPG',tags:['摄影','自然'],project:'daily',height:195,width:1000,imageHeight:667,source:'https://unsplash.com/'},
    {id:'building',name:'建筑立面 · 几何的节奏',src:'assets/building.jpg',kind:'image',format:'JPG',tags:['建筑','极简'],project:'web',height:258,width:1000,imageHeight:667,source:'https://unsplash.com/'}
  ];
  function initialData() {
    return {
      version:1,
      assets:SEEDS.map((a,i)=>({...a,tags:[...a.tags],created:Date.now()-i*3600000,favorite:['type','mori','dune'].includes(a.id),notes:'',sample:true})),
      projects:[
        {id:'brand',name:'Mori 品牌焕新',color:1,note:'收集自然、克制、有呼吸感的视觉。关注字体、纸张质感与日常物件之间的关系。'},
        {id:'web',name:'独立网站灵感',color:2,note:'留意导航、首屏层级与细节交互。把值得借鉴的设计放在一起。'},
        {id:'daily',name:'日常灵感收集',color:3,note:'记录那些让人想多看一眼的瞬间。'}
      ],settings:{figmaURL:''}
    };
  }
  async function prepareSeed() {
    const seed = initialData();
    await Promise.all(seed.assets.map(async a => {
      try { const image = await loadImage(a.src); a.width = image.naturalWidth; a.imageHeight = image.naturalHeight; } catch {}
    }));
    const sources = {space:'photo-1600210492486-724fe5c67fb0',flowers:'photo-1490750967868-88aa4486c946',dune:'photo-1509316785289-025f5b846b35',chair:'photo-1598300042247-d088f8ab3a91',interior:'photo-1616486338812-3dadae4b4ace',ocean:'photo-1518837695005-2083093ee35b',building:'photo-1487958449943-2429e8be8625'};
    seed.assets.forEach(a => { if (sources[a.id]) a.source = `https://images.unsplash.com/${sources[a.id]}`; });
    return seed;
  }
  async function loadData() {
    try { data = await repository.open(prepareSeed); initialized = true; persistent = true; }
    catch {
      // If migration is blocked (for example by quota), keep showing the user's
      // original snapshot rather than replacing its presentation with demo data.
      try { const legacy = await repository.get('main'); if (legacy?.version === 1) data = legacy; } catch {}
      data ||= initialData(); initialized = false; persistent = false;
    }
    updateSaveState();
    data.trash ||= [];data.deletedIDs ||= [];
  }
  function saveChanges(operations, options = {}) {
    const task = { operations, ...options, key: options.key || uid() };
    saving++; updateSaveState();
    const run = async () => {
      let results;
      try {
        if (!initialized) { await repository.open(prepareSeed); initialized = true; }
        results = await repository.mutate(typeof operations === 'function' ? operations() : operations);
      } catch (error) {
        task.error = error;
        failedWrites.set(task.key, task);
        persistent = false;
        options.onError?.(error);
        saving--; updateSaveState();
        return false;
      }
      failedWrites.delete(task.key);
      persistent = failedWrites.size === 0;
      // A post-commit read failure must never cause an already committed toggle to retry.
      try { data = await repository.read(); } catch { applyCommitted(operations, results); }
      saving--; updateSaveState();
      if (options.render !== false) render();
      options.onSuccess?.(results);
      return true;
    };
    const result = writeChain.then(run, run);
    writeChain = result.catch(error => { console.error(error); });
    return result;
  }
  function applyCommitted(operations, results) {
    const ops = typeof operations === 'function' ? operations() : operations;
    for (const op of ops) {
      if (op.entity === 'settings') { data.settings = results.find(r => !r.id) || data.settings; continue; }
      const list = op.entity === 'asset' ? data.assets : op.entity === 'trash' ? data.trash : data.projects;
      const id = op.id || op.record?.id, index = list.findIndex(r => r.id === id);
      const record = results.find(r => r.id === id);
      if (['delete','trash','restore-trash'].includes(op.kind)) {
        if(index>=0)list.splice(index,1);
        if(op.kind==='trash'&&record)data.trash.unshift(record);
        if(op.kind==='restore-trash'&&record)data.assets.unshift(record);
        if(op.kind==='delete'&&['asset','trash'].includes(op.entity))data.deletedIDs.push(id);
        continue;
      }
      if (record) { if (index >= 0) list[index] = record; else list.push(record); }
    }
  }
  async function retrySaves() {
    if (saving) return;
    if (!initialized && !failedWrites.size) { await loadData(); render(); return; }
    for (const task of [...failedWrites.values()]) {
      if (['conflict', 'missing', 'duplicate'].includes(task.error?.code)) continue;
      const {operations, error, ...options} = task;
      await saveChanges(operations, options);
    }
  }
  async function resolveFailedSave() {
    const task = [...failedWrites.values()].find(t => ['conflict','missing','duplicate'].includes(t.error?.code));
    if (!task) return retrySaves();
    await refreshFromStore();
    const operations = typeof task.operations === 'function' ? task.operations() : task.operations;
    const op = operations[0];
    const latest = op.entity === 'settings' ? data.settings : (op.entity === 'asset' ? data.assets : op.entity==='trash' ? data.trash : data.projects).find(r => r.id === (op.id || op.record?.id));
    if (op.kind !== 'patch' || !latest) {
      failedWrites.delete(task.key);persistent=failedWrites.size===0;updateSaveState();
      if (latest && op.entity === 'asset') openDetail(latest.id);
      else { closeDialog(); render(); toast('素材列表已更新，请核对后重新操作。'); }
      return;
    }
    const fields = Object.keys(op.changes);
    openDialog(`${modalHeading('核对这次修改','SAVE / CONFLICT')}<div class="modal-body"><p class="modal-intro">同一字段在另一个窗口发生了修改。两份内容都列在下面，你可以决定保留哪一份。</p>${fields.map(field=>`<div class="conflict-values"><div><strong>已保存的最新内容</strong><p>${escapeHTML(latest[field] ?? '（空）')}</p></div><div><strong>你的输入</strong><p>${escapeHTML(op.changes[field] ?? '（空）')}</p></div></div>`).join('')}</div><div class="modal-actions"><button class="button" id="useLatest">使用最新内容</button><button class="button primary" id="keepDraft">保存我的输入</button></div>`);
    modalKind='conflict';updateSaveState();
    $('#useLatest').onclick=()=>{
      failedWrites.delete(task.key);fieldDrafts.delete(task.key);persistent=failedWrites.size===0;updateSaveState();
      if(op.entity==='asset')openDetail(op.id);else{closeDialog();render();}
    };
    $('#keepDraft').onclick=async e=>{
      e.target.disabled=true;
      const {operations:ignored,error,...options}=task;
      const updated={...op,expected:Object.fromEntries(fields.map(field=>[field,latest[field]]))};
      await saveChanges([updated],{...options,onSuccess:results=>{options.onSuccess?.(results);if(op.entity==='asset')openDetail(op.id);else{closeDialog();render();}},onError:()=>{modalKind='generic';if(e.target.isConnected)e.target.disabled=false;}});
    };
  }
  function saveFailureMessage(error) {
    if (['conflict', 'missing', 'duplicate'].includes(error?.code)) return error.message;
    return '保存未完成，输入已保留。请检查浏览器存储空间后重试。';
  }
  function updateSaveState() {
    const dirty = fieldDrafts.size > 0;
    const label = saving ? '正在保存…' : failedWrites.size || !initialized ? '未能保存' : dirty ? '待保存' : '本地已保存';
    $('#saveState').innerHTML = icon(failedWrites.size || !initialized ? 'circle-alert' : 'hard-drive') + `<span>${label}</span>`;
    const failure = [...failedWrites.values()][0];
    const message = failure ? saveFailureMessage(failure.error) : !initialized ? '本地素材库暂时无法打开，请重试连接。' : '';
    for (const container of [$('#saveNotice'), $('#modalSaveStatus')].filter(Boolean)) {
      container.hidden = !message || (container.id === 'modalSaveStatus' && modalKind === 'conflict');
      if (message) {
        const conflict = ['conflict', 'missing', 'duplicate'].includes(failure?.error?.code);
        container.innerHTML = `${icon('circle-alert')}<span>${escapeHTML(message)}</span><button class="button" data-action="${conflict ? 'resolve-save' : 'retry-save'}" ${saving ? 'disabled' : ''}>${conflict ? '查看最新内容' : saving ? '正在重试…' : '重试保存'}</button>`;
      }
    }
    hydrateIcons();
  }
  async function refreshFromStore() {
    if (!initialized || refreshing || saving) return;
    refreshing = true;
    try {
      const latest = await repository.read();
      const fingerprint = value => JSON.stringify([value.assets.map(a=>[a.id,a._revision]),(value.trash||[]).map(a=>[a.id,a._revision]),value.deletedIDs,value.projects.map(p=>[p.id,p._revision]),value.settings._revision]);
      if (fingerprint(latest) !== fingerprint(data)) { data = latest; render(); }
      updateSaveState();
    }
    catch { /* A visibility refresh is retried on the next activation. */ }
    finally { refreshing = false; }
  }
  repository.subscribe(refreshFromStore);
  window.addEventListener('focus', refreshFromStore);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshFromStore(); });

  function focusIdentity(element = document.activeElement) {
    if (!element || element === document.body) return null;
    let selector = element.id ? `#${CSS.escape(element.id)}` : '';
    if (!selector && element.dataset.action) selector = Object.entries(element.dataset).map(([key, value]) => `[data-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(value)}"]`).join('');
    if (!selector && element.name) selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
    return {element, selector, scope: element.closest('#modalContent') ? '#modalContent' : element.closest('#sidebar') ? '#sidebar' : '#main', start:element.selectionStart, end:element.selectionEnd};
  }
  function restoreFocus(identity, fallback, force = false) {
    if (!identity && !fallback) return;
    if (!force && identity?.element?.isConnected) return;
    const root = identity?.scope ? $(identity.scope) : document;
    const target = identity?.selector ? $(identity.selector, root || document) : null;
    const element = target || (fallback ? $(fallback) : null);
    if (!element || element.closest('[inert]')) return;
    element.focus({preventScroll:true});
    if (identity?.start != null && element.setSelectionRange) try { element.setSelectionRange(identity.start, identity.end); } catch {}
  }
  function bindSavedField(element, entity, id, field, value) {
    const key = `${entity}:${id}:${field}`;
    const draft = fieldDrafts.get(key);
    if (draft) element.value = draft.value;
    element.dataset.draftKey = key;
    element.addEventListener('input', () => {
      const current = fieldDrafts.get(key) || { expected:value, value:element.value };
      current.value = element.value;
      fieldDrafts.set(key, current); updateSaveState();
    });
    element.addEventListener('change', () => {
      const entry = fieldDrafts.get(key) || {expected:value, value:element.value};
      entry.value = element.value;
      if (field === 'name' && !entry.value.trim()) { element.value = value; fieldDrafts.delete(key); updateSaveState(); return; }
      fieldDrafts.set(key, entry);
      const committedValue = entry.value;
      saveChanges(() => [{kind:'patch', entity, id, changes:{[field]:committedValue}, expected:{[field]:entry.expected}}], {
        key,
        onSuccess: () => {
          value = committedValue; entry.expected = committedValue;
          if (entry.value === committedValue) fieldDrafts.delete(key);
          updateSaveState();
          if (field === 'name' && modal.open && selectedAsset === id) $('#modalTitle').textContent = committedValue;
        }
      });
    });
  }
  function toast(message, type='', action=null) {
    const node=document.createElement('div');node.className=`toast ${type}`;
    node.innerHTML=`${icon(type==='error'?'circle-alert':'check')}<span>${escapeHTML(message)}</span>${action?`<button>${escapeHTML(action.label)}</button>`:''}${action||type==='error'?`<button class="toast-dismiss" aria-label="关闭提示">${icon('x')}</button>`:''}`;
    $('#toasts').append(node);hydrateIcons();
    let timer = !action && type !== 'error' ? setTimeout(()=>node.remove(),5000) : null;
    node.addEventListener('mouseenter',()=>clearTimeout(timer));node.addEventListener('mouseleave',()=>{if(!action&&type!=='error')timer=setTimeout(()=>node.remove(),2500);});
    if(action)$('button',node).onclick=()=>{action.run();node.remove();};
    $('.toast-dismiss',node)?.addEventListener('click',()=>node.remove());
  }
  function navigate(next, project='', tag='') {
    route=next;activeProject=project;tagFilter=tag;typeFilter='all';query='';searchScope='current';$('#search').value='';
    const hash=next==='project'?`project/${encodeURIComponent(project)}`:next==='tag'?`tag/${encodeURIComponent(tag)}`:next;
    history.replaceState(null,'',`#${hash}`);closeSidebar();render();window.scrollTo({top:0,behavior:'instant'});
    if (project) saveChanges([{kind:'touch',entity:'project',id:project,field:'lastOpenedAt',at:Date.now()}], {key:`visit:${project}`,render:false});
  }
  function renderNav() {
    const nav=[['workspace','工作台','panels-top-left',''],['library','全部素材','library',data.assets.length],['recent','最近添加','clock-3',''],['favorites','我的收藏','star',data.assets.filter(a=>a.favorite).length],['trash','回收站','trash-2',data.trash.length]];
    $('#mainNav').innerHTML=nav.map(([id,label,glyph,count])=>`<button class="nav-item ${route===id?'active':''}" data-action="navigate" data-route="${id}" ${route===id?'aria-current="page"':''}>${icon(glyph)}<span>${label}</span>${count!==''?`<span class="count">${count}</span>`:''}</button>`).join('');
    $('#projectNav').innerHTML=data.projects.map(p=>`<button class="nav-item project-nav ${route==='project'&&activeProject===p.id?'active':''}" data-action="project" data-id="${escapeHTML(p.id)}" title="${escapeHTML(p.name)}" ${activeProject===p.id?'aria-current="page"':''}><span class="project-marker" style="--project-color:var(--color-project-${p.color})"></span><span class="project-nav-name">${escapeHTML(p.name)}</span><span class="count">${data.assets.filter(a=>a.project===p.id).length}</span></button>`).join('');
    const tags=['品牌设计','网页设计','极简','自然','字体排版'];
    $('#sidebarTags').innerHTML=tags.map(tag=>`<button class="sidebar-tag ${tagFilter===tag?'active':''}" data-action="tag-filter" data-tag="${tag}"><span class="mono">#</span> ${tag}</button>`).join('');
  }
  function headingTitle() {
    if(route==='trash')return '回收站';
    if(query)return '搜索结果';
    if(route==='project')return data.projects.find(p=>p.id===activeProject)?.name || '项目素材';
    if(route==='tag')return `# ${tagFilter}`;
    return {workspace:'工作台',library:'全部素材',recent:'最近添加',favorites:'我的收藏'}[route]||'全部素材';
  }
  function projectCard(p) {
    const assets=data.assets.filter(a=>a.project===p.id), covers=assets.filter(a=>a.src).slice(0,3);
    return `<button class="project-card" data-action="project" data-id="${escapeHTML(p.id)}"><div class="project-preview ${covers.length?'':'empty-cover'}">${covers.length?covers.map(a=>`<img src="${escapeHTML(a.src)}" alt="" loading="lazy">`).join(''):icon('folder')}</div><div class="project-meta"><strong>${escapeHTML(p.name)}</strong><span>${String(assets.length).padStart(2,'0')} 个素材 ↗</span></div></button>`;
  }
  function baseAssets() {
    const scoped = !query || searchScope === 'current';
    let list=data.assets.filter(a=>{
      if(scoped&&route==='favorites'&&!a.favorite)return false;
      if(scoped&&route==='project'&&a.project!==activeProject)return false;
      if(scoped&&tagFilter&&!a.tags.includes(tagFilter))return false;
      if(query) return `${a.name} ${a.tags.join(' ')} ${a.url||''} ${a.notes||''}`.toLowerCase().includes(query.toLowerCase());
      return true;
    });
    return list.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name,'zh-CN'):sort==='oldest'?(a,b)=>a.created-b.created:(a,b)=>b.created-a.created);
  }
  function visibleAssets() {return baseAssets().filter(a=>typeFilter==='all'||a.kind===typeFilter);}
  function contextLabel() {
    if (route === 'trash') return '回收站';
    if (route === 'project') return data.projects.find(p => p.id === activeProject)?.name || '当前项目';
    if (route === 'favorites') return '我的收藏';
    if (tagFilter) return `标签：${tagFilter}`;
    return '全部素材';
  }
  function recentProjects() {
    return [...data.projects].sort((a,b) => Math.max(b.lastOpenedAt||0,b.updatedAt||0,b.created||0)-Math.max(a.lastOpenedAt||0,a.updatedAt||0,a.created||0)).slice(0,3);
  }
  function assetVisual(a) {
    if(a.src&&isImageSource(a.src))return `<img src="${escapeHTML(a.src)}" alt="${escapeHTML(a.name)}" loading="lazy">`;
    return `<div class="bookmark-cover">${icon('globe')}<strong>${escapeHTML(hostname(a.url))}</strong><span>SAVED TO PARTICLE ↗</span></div>`;
  }
  function assetCard(a) {
    return `<article class="asset-card" data-asset="${escapeHTML(a.id)}" style="--card-height:${a.height||215}px;--mobile-card-height:${Math.round((a.height||215)*.78)}px"><button class="asset-open" data-action="detail" data-id="${escapeHTML(a.id)}" aria-label="查看 ${escapeHTML(a.name)}"><div class="asset-visual">${assetVisual(a)}<span class="asset-kind">${icon(a.kind==='link'?'link-2':'image')}${a.kind==='link'?escapeHTML(hostname(a.url)):escapeHTML(a.format||'IMAGE')}</span></div><div class="asset-copy"><h3>${escapeHTML(a.name)}</h3><div class="asset-subtitle"><span class="tag-label">${escapeHTML(a.tags.slice(0,2).join(' / ')||'待整理')}</span><span>·</span><span>${dateLabel(a.created)}</span></div></div></button><div class="card-actions"><button class="icon-button ${a.favorite?'is-favorite':''}" data-action="favorite" data-id="${escapeHTML(a.id)}" aria-label="${a.favorite?'取消收藏':'收藏'} ${escapeHTML(a.name)}" aria-pressed="${a.favorite}">${icon('star')}</button><button class="icon-button more-action" data-action="asset-menu" data-id="${escapeHTML(a.id)}" aria-label="${escapeHTML(a.name)}的更多操作">${icon('ellipsis')}</button></div>${a.favorite?`<span class="favorite-indicator" aria-hidden="true">${icon('star')}</span>`:''}</article>`;
  }
  function render() {
    if(!data)return;
    const focused = focusIdentity();
    cancelAnimationFrame(heroFrame);heroObserver?.disconnect();renderNav();
    const title=headingTitle(),home=route==='workspace'&&!query,project=data.projects.find(p=>p.id===activeProject);
    const scopeName = searchScope === 'all' ? '全部素材' : contextLabel();
    $('#search').setAttribute('aria-label',scopeName==='全部素材'?'搜索全部素材、标签或灵感':`搜索${scopeName}中的素材、标签或灵感`);
    $('#search').placeholder = scopeName === '全部素材' ? '搜索全部素材、标签…' : `搜索：${scopeName}`;
    $('#breadcrumbTitle').textContent=title;
    if(route==='trash'){renderTrash();restoreFocus(focused,'#main');return;}
    const date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    $('#main').innerHTML=`<div class="page-heading"><div><h1>${escapeHTML(title)} ${home?'<span class="mono">/ WORKSPACE</span>':''}</h1><p>${home?'欢迎回来。接着上一次的灵感，继续创作。':query?`关于「${escapeHTML(query)}」的素材与链接`:route==='favorites'?'那些值得反复回看的好设计。':route==='project'?'把散落的灵感，连成一个清晰的方向。':'图片、网页和想法，在这里慢慢建立联系。'}</p></div>${home?`<div class="date-stamp mono"><span class="status-mark"></span>${date}</div>`:route==='project'?`<button class="button" data-action="import">${icon('plus')}添加到项目</button>`:''}</div>
      ${home?`<section class="workspace-hero" aria-label="灵感工作台介绍"><div class="hero-content"><div class="eyebrow"><span>{ 01 }</span> COLLECT SMALL. CREATE BIG.</div><h2>让每一颗灵感，<br>都有自己的轨迹。</h2><p>从一张图片、一个链接，到下一个好设计。</p><button class="hero-link" data-action="import">收集新的灵感 <span>↗</span></button></div><div class="hero-art" aria-hidden="true"><canvas id="particleCanvas"></canvas><span class="hero-cross">+</span><span class="art-caption">IDEAS ARE PARTICLES. CONNECT THE DOTS.</span></div></section><section class="project-section"><div class="section-heading"><div class="section-title"><h2>继续你的项目</h2><span class="section-index mono">/ RECENT PROJECTS</span></div><button class="button ghost" data-action="new-project">${icon('plus')}新建项目</button></div><div class="projects-grid">${recentProjects().map(projectCard).join('')}</div></section>`:''}
      ${route==='project'&&project?`<div class="project-note">${icon('notebook-pen')}<textarea id="projectNote" aria-label="项目灵感笔记" placeholder="记录这个项目的方向与想法…">${escapeHTML(project.note)}</textarea><span class="saved-note">失焦时保存</span></div>`:''}
      <section aria-label="素材列表">${contextLabel()!=='全部素材'?`<div class="search-scope-row"><label for="searchScope">搜索范围</label><select id="searchScope"><option value="current" ${searchScope==='current'?'selected':''}>${escapeHTML(contextLabel())}</option><option value="all" ${searchScope==='all'?'selected':''}>全部素材</option></select><span>${query?'当前结果来自所选范围':'输入关键词后按此范围查找'}</span></div>`:''}<div class="library-header"><div class="library-title"><h2>${home?'最近收集':query?'匹配的素材':'灵感档案'}</h2><span id="resultCount"></span></div><div class="library-tools">${home?`<button class="button ghost" data-action="navigate" data-route="library">查看全部 ↗</button>`:''}<select id="sortSelect" aria-label="素材排序"><option value="newest" ${sort==='newest'?'selected':''}>最近添加</option><option value="oldest" ${sort==='oldest'?'selected':''}>最早添加</option><option value="name" ${sort==='name'?'selected':''}>名称排序</option></select><div class="view-switch" role="group" aria-label="素材展示方式"><button class="icon-button ${view==='grid'?'selected':''}" data-action="view" data-view="grid" aria-label="瀑布流视图" aria-pressed="${view==='grid'}">${icon('layout-grid')}</button><button class="icon-button ${view==='list'?'selected':''}" data-action="view" data-view="list" aria-label="列表视图" aria-pressed="${view==='list'}">${icon('list')}</button></div></div></div><div class="filter-row"><div class="type-filters" id="typeFilters"></div><div class="filter-summary">${tagFilter&&(!query||searchScope==='current')?`<button class="active-filter" data-action="clear-tag"># ${escapeHTML(tagFilter)} ${icon('x')}</button>`:`<span class="muted">${icon('mouse-pointer-2')} 选择素材，查看详情</span>`}</div></div><div id="assetGrid" class="asset-grid ${view==='list'?'list-view':''}"></div><div class="sample-note">${icon('info')}内置素材为示例内容 · 你的导入与编辑保存在当前浏览器</div></section>`;
    renderGrid();$('.view-switch')?.setAttribute('role','group');hydrateIcons();
    $('#sortSelect').addEventListener('change',e=>{sort=e.target.value;renderGrid();});
    if ($('#projectNote')) bindSavedField($('#projectNote'),'project',project.id,'note',project.note);
    $('#searchScope')?.addEventListener('change',e=>{searchScope=e.target.value;render();});
    if(home)drawParticles();
    restoreFocus(focused, '#main');
  }
  function renderGrid() {
    const focused = focusIdentity();
    const list=visibleAssets(),base=baseAssets();
    $('#resultCount').textContent=`${list.length} 个素材`;
    $('#typeFilters').innerHTML=[['all','全部',''],['image','图片','image'],['link','网页链接','link-2']].map(([id,label,glyph])=>`<button class="filter-chip ${typeFilter===id?'active':''}" data-action="type" data-type="${id}" aria-pressed="${typeFilter===id}">${glyph?icon(glyph):''}${label}<span class="mono">${id==='all'?base.length:base.filter(a=>a.kind===id).length}</span></button>`).join('');
    const grid=$('#assetGrid');grid.className=`asset-grid ${view==='list'?'list-view':''}`;
    if(list.length)grid.innerHTML=list.map(assetCard).join('');
    else {const expand=query&&searchScope==='current'&&contextLabel()!=='全部素材';grid.className='';grid.innerHTML=`<div class="no-results">${icon(query?'search-x':'folder-open')}<h2>${query?'还没找到这颗灵感':'这里还有很多可能'}</h2><p>${query?`「${escapeHTML(query)}」在${escapeHTML(searchScope==='all'?'全部素材':contextLabel())}中没有匹配结果。`:route==='favorites'?'点击素材上的星标，把喜欢的设计留在这里。':'添加一张图片或一个链接，开始收集。'}</p><button class="button" data-action="${expand?'search-all':query||typeFilter!=='all'?'clear-filters':'import'}">${expand?'搜索全部素材':query||typeFilter!=='all'?'清除筛选':'添加素材'}</button></div>`;}
    hydrateIcons();
    restoreFocus(focused, '#main');
  }
  function drawParticles() {
    const canvas=$('#particleCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw=(progress=1)=>{
      const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=box.width*dpr;canvas.height=box.height*dpr;ctx.scale(dpr,dpr);
      const w=box.width,h=box.height,cx=w*.57,cy=h*.47,scale=Math.min(w/3.6,h/1.82);
      ctx.clearRect(0,0,w,h);
      // Ink particles on a warped annulus; restrained 2D graphic, no WebGL.
      for(let r=0;r<35;r++)for(let t=0;t<155;t++){
        const theta=t/155*Math.PI*2,band=r/34;
        const radial=.42+band*.61+.09*Math.sin(theta*3+band*2.3);
        let x=Math.cos(theta)*radial,y=Math.sin(theta)*radial;
        x+=.23*Math.sin(theta*2)*(1-band);y*=.65;
        const rotation=-.35,xx=x*Math.cos(rotation)-y*Math.sin(rotation),yy=x*Math.sin(rotation)+y*Math.cos(rotation);
        const noise=(Math.sin(t*17.17+r*69.31)*43758.5453)%1;
        const opacity=(.25+.6*(Math.sin(theta+1)+1)/2)*progress;
        ctx.fillStyle=`rgba(26,26,26,${Math.max(.08,opacity)})`;
        ctx.beginPath();ctx.arc(cx+xx*scale+(noise*.35),cy+yy*scale+(noise*.35),(.48+band*.35)*Math.min(1.4,scale/100),0,Math.PI*2);ctx.fill();
      }
      for(let i=0;i<70;i++){
        const x=cx+Math.sin(i*91.19)*scale*1.44,y=cy+Math.cos(i*31.72)*scale*.78;
        if(Math.hypot((x-cx)/scale,(y-cy)/scale)<1.04)continue;
        ctx.fillStyle=`rgba(26,26,26,${.16*progress})`;ctx.beginPath();ctx.arc(x,y,.6,0,Math.PI*2);ctx.fill();
      }
    };
    if(reduce)draw();else{const start=performance.now();const animate=t=>{const p=Math.min((t-start)/480,1);draw(.2+.8*p);if(p<1)heroFrame=requestAnimationFrame(animate);};heroFrame=requestAnimationFrame(animate);}
    heroObserver=new ResizeObserver(()=>draw());heroObserver.observe(canvas);
  }
  function openDialog(content, className='') {
    const wasOpen = modal.open, focused = wasOpen ? focusIdentity() : null;
    if (!wasOpen) lastFocus = focusIdentity($('#sidebar').classList.contains('open') ? $('[data-action="menu"]') : document.activeElement);
    closeSidebar(false);
    modalKind = 'generic';
    modal.className=className;$('#modalContent').innerHTML=content;
    const status = document.createElement('div'); status.id='modalSaveStatus'; status.className='save-notice modal-save-notice'; status.setAttribute('role','status'); status.hidden=true;
    $('.modal-heading',modal)?.after(status);
    $('#modalTitle')?.setAttribute('tabindex','-1');
    if(!wasOpen)modal.showModal();
    hydrateIcons(); updateSaveState(); modal.scrollTop=0;
    if (wasOpen) restoreFocus(focused, '#modalTitle', true);
  }
  function closeDialog(){modal.close();editor=null;modalKind='';restoreFocus(lastFocus, '#main', true);}
  function modalHeading(title,kicker='PARTICLE / YOUR CREATIVE SPACE',actions='') {
    return `<div class="modal-heading"><div><div class="eyebrow">${escapeHTML(kicker)}</div><h2 id="modalTitle">${escapeHTML(title)}</h2></div><div class="details-actions">${actions}<button class="icon-button" data-action="close-modal" aria-label="关闭弹窗">${icon('x')}</button></div></div>`;
  }
  function openImport(tab='file') {
    importTab=tab;
    openDialog(`${modalHeading('收集一颗新灵感','COLLECT / 01')}<div class="modal-tabs"><button class="modal-tab ${tab==='file'?'active':''}" data-action="import-tab" data-tab="file">${icon('image-plus')}上传图片</button><button class="modal-tab ${tab==='link'?'active':''}" data-action="import-tab" data-tab="link">${icon('link-2')}保存网页链接</button></div><div class="modal-body">${tab==='file'?`<button class="upload-zone" data-action="choose-file">${icon('upload')}<strong>拖拽图片到这里，或点击上传</strong><span>JPG、PNG、WebP、GIF、AVIF · 每张不超过 12 MB</span><span class="mono">也可以直接 ⌘ V 粘贴图片</span></button><div class="helper-note">${icon('tags')}导入后会根据文件名给出标签建议，由你决定是否添加。</div>`:`<form id="linkForm"><label class="field">网页地址<input type="url" name="url" id="linkURL" placeholder="https://…" required aria-describedby="linkError"></label><label class="field">标题 <span class="muted">（选填）</span><input type="text" name="title" maxlength="120" placeholder="为这个灵感起个名字"></label><label class="field">缩略图 <span class="muted">（选填）</span><input type="file" name="cover" accept="image/jpeg,image/png,image/webp"><small>可上传网页截图；未上传时显示网站名称封面。</small></label><div id="linkError" class="form-error" role="alert"></div><div class="helper-note">保留网页原链接。自动抓取网页截图需要后续接入采集服务。</div></form>`}</div><div class="modal-actions"><button class="button" data-action="close-modal">取消</button>${tab==='file'?`<button class="button primary" data-action="choose-file">${icon('plus')}选择图片</button>`:`<button class="button primary" form="linkForm" type="submit">保存到素材库 ${icon('arrow-right')}</button>`}</div>`);
  }
  async function readImage(file) {
    if(!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type))throw new Error(`${file.name}：暂不支持这个图片格式`);
    if(file.size>12*1024*1024)throw new Error(`${file.name}：请使用小于 12 MB 的图片`);
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('图片读取失败'));r.readAsDataURL(file);});
    const img=await loadImage(src);
    return {src,width:img.naturalWidth,imageHeight:img.naturalHeight,bytes:file.size,format:file.type.split('/')[1].toUpperCase().replace('JPEG','JPG')};
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();if(!src.startsWith('data:'))img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('图片无法载入，请检查文件或原站访问权限'));img.src=src;});}
  function suggestTags(a) {
    const text=`${a.name} ${a.url||''}`.toLowerCase();
    const rules=[[/brand|logo|mori|品牌|标志/,'品牌设计'],[/web|figma|awwward|网站|网页|界面|ui\b/,'网页设计'],[/type|font|字体|排版|poster/,'字体排版'],[/nature|flower|tree|自然|花|山|海|沙丘/,'自然'],[/minimal|less|quiet|极简|留白/,'极简'],[/photo|img_|dsc|摄影/,'摄影'],[/room|space|interior|空间|室内/,'空间'],[/design.?system|设计系统|组件/,'设计系统']];
    const matches=rules.filter(([rule])=>rule.test(text)).map(([,tag])=>tag);
    if(!matches.length)matches.push(a.kind==='link'?'网页参考':'视觉参考');
    matches.push('灵感收集');return [...new Set(matches)].filter(tag=>!a.tags.includes(tag));
  }
  async function importFiles(files) {
    const list=[...files];if(!list.length)return;
    const targetProject=route==='project'?activeProject:'';let added=[],errors=[];
    toast(`正在读取 ${list.length} 张图片…`);
    for(const file of list){try{const props=await readImage(file);const a={id:uid(),name:file.name.replace(/\.[^.]+$/,''),...props,kind:'image',tags:[],project:targetProject,favorite:false,notes:'',created:Date.now(),height:Math.max(180,Math.min(280,props.imageHeight/props.width*240))};added.push(a);}catch(error){errors.push(error.message);}}
    if(added.length) await saveChanges(added.map(a=>({kind:'add',entity:'asset',record:a})),{onSuccess:()=>{toast(`已导入 ${added.length} 张图片`);openDetail(added[0].id);}});
    errors.forEach(error=>toast(error,'error'));$('#quickUpload').value='';
  }
  async function addLink(form) {
    const error=$('#linkError'),url=safeURL(form.elements.url.value.trim());
    if(!url){error.textContent='请输入完整的 http:// 或 https:// 网页地址。';return;}
    const duplicate=data.assets.find(a=>a.kind==='link'&&a.url===url);
    if(duplicate){openDetail(duplicate.id);toast('这个链接已经在素材库中，已为你打开。');return;}
    const submit=$('[form="linkForm"]');submit.disabled=true;submit.textContent='正在保存…';
    try{
      let props={};const file=form.elements.cover.files[0];if(file)props=await readImage(file);
      const a={id:form.dataset.assetId||uid(),name:form.elements.title.value.trim()||hostname(url),kind:'link',url,...props,format:'URL',coverFormat:props.format,tags:[],project:route==='project'?activeProject:'',created:Date.now(),favorite:false,notes:'',height:210};
      form.dataset.assetId=a.id;
      await saveChanges([{kind:'add',entity:'asset',record:a}],{key:`add-link:${a.id}`,onSuccess:()=>{if(form.isConnected)openDetail(a.id);toast('网页链接已收好');},onError:()=>{submit.disabled=false;submit.textContent='重试保存链接';}});
    }catch(err){error.textContent=err.message;submit.disabled=false;submit.textContent='保存到素材库';}
  }
  function getAsset(id=selectedAsset){return data.assets.find(a=>a.id===id);}
  function openDetail(id) {
    selectedAsset=id;editor=null;const a=getAsset();if(!a)return;
    const suggestions=suggestTags(a),source=safeURL(a.url||a.source||'');
    openDialog(`${modalHeading(a.name,'ASSET / '+(a.kind==='link'?'WEB BOOKMARK':a.format||'IMAGE'),`<button class="icon-button ${a.favorite?'selected':''}" data-action="favorite" data-id="${escapeHTML(a.id)}" aria-label="${a.favorite?'取消收藏':'收藏'}此素材" aria-pressed="${a.favorite}">${icon('star')}</button>`)}<div class="detail-layout"><div class="detail-preview">${assetVisual(a)}<span class="preview-caption">${a.coverNote?escapeHTML(a.coverNote):'ORIGINAL / '+(a.format||'IMAGE')}</span></div><div class="detail-info"><div class="detail-section"><label class="field">素材名称<input id="assetName" value="${escapeHTML(a.name)}" maxlength="120"></label><dl class="metadata-grid"><dt>类型</dt><dd>${a.kind==='link'?'WEB BOOKMARK':escapeHTML(a.format||'IMAGE')}</dd>${a.width?`<dt>尺寸</dt><dd>${a.width} × ${a.imageHeight} PX</dd>`:''}<dt>添加于</dt><dd>${new Date(a.created).toLocaleDateString('zh-CN')}</dd>${a.kind==='image'?`<dt>文件</dt><dd>${byteLabel(a.bytes)}</dd>`:''}${source?`<dt>来源</dt><dd><a href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer">${escapeHTML(hostname(source))} ↗</a></dd>`:''}</dl></div><div class="detail-section"><h3>标签 <span class="mono muted">${String(a.tags.length).padStart(2,'0')}</span></h3><div class="detail-tags">${a.tags.map(tag=>`<button class="tag" data-action="remove-tag" data-tag="${escapeHTML(tag)}" aria-label="移除标签 ${escapeHTML(tag)}">${escapeHTML(tag)} ${icon('x')}</button>`).join('')||'<span class="muted">还没有标签</span>'}</div><form class="tag-input-row" id="tagForm"><input name="tag" aria-label="新标签" placeholder="添加自定义标签…" maxlength="24" required><button class="button" type="submit">${icon('plus')}</button></form>${suggestions.length?`<h3 style="margin-top:var(--sp-5)">${icon('sparkles')} 建议标签 <span class="state-badge">本地规则</span></h3><div class="detail-tags">${suggestions.map(tag=>`<button class="tag suggestion-tag" data-action="accept-tag" data-tag="${escapeHTML(tag)}">${icon('plus')}${escapeHTML(tag)}</button>`).join('')}</div><p class="suggestion-info">根据文件名与链接推测，点击才会添加。视觉 AI 尚未连接。</p>`:''}</div><div class="detail-section"><label class="field">所属项目<select id="assetProject"><option value="">未归入项目</option>${data.projects.map(p=>`<option value="${escapeHTML(p.id)}" ${p.id===a.project?'selected':''}>${escapeHTML(p.name)}</option>`).join('')}</select></label><label class="field">灵感笔记<textarea id="assetNotes" placeholder="为什么收集它？记下此刻的想法。">${escapeHTML(a.notes)}</textarea></label><p class="suggestion-info">名称、项目和笔记会在离开输入框后保存。</p></div><div class="detail-button-row">${a.kind==='image'?`<button class="button ink" data-action="edit-image">${icon('sliders-horizontal')}图像工作室</button>`:`<a class="button ink" href="${escapeHTML(source)}" target="_blank" rel="noopener noreferrer">${icon('external-link')}打开网页</a>`}<button class="button" data-action="figma">${icon('figma')}前往 Figma</button></div><div class="detail-button-row" style="margin-top:var(--sp-2)">${a.src?`<button class="button ghost" data-action="download-asset" data-id="${escapeHTML(a.id)}">${icon('download')}下载${a.kind==='link'?'封面':'图片'}</button>`:''}<button class="button ghost danger" data-action="delete-asset" data-id="${escapeHTML(a.id)}">${icon('trash-2')}移除素材</button></div></div></div>`,'detail-dialog');
    modalKind='detail';
    updateDetailTags();
    bindSavedField($('#assetName'),'asset',a.id,'name',a.name);
    bindSavedField($('#assetProject'),'asset',a.id,'project',a.project);
    bindSavedField($('#assetNotes'),'asset',a.id,'notes',a.notes);
  }
  function updateDetailTags() {
    if (!modal.open || modalKind !== 'detail') return;
    const a=getAsset(); if(!a)return;
    const focused=focusIdentity(), input=$('#tagForm input')?.value||'', suggestions=suggestTags(a);
    const section=$$('.detail-section',modal)[1];
    section.innerHTML=`<h3>标签 <span class="mono muted">${String(a.tags.length).padStart(2,'0')}</span></h3><div class="detail-tags">${a.tags.map(tag=>`<button class="tag" data-action="remove-tag" data-tag="${escapeHTML(tag)}" aria-label="移除标签 ${escapeHTML(tag)}">${escapeHTML(tag)} ${icon('x')}</button>`).join('')||'<span class="muted">还没有标签</span>'}</div><form class="tag-input-row" id="tagForm"><input name="tag" aria-label="新标签" placeholder="添加自定义标签…" maxlength="24" required value="${escapeHTML(input)}"><button class="button" type="submit" aria-label="添加标签">${icon('plus')}</button></form>${suggestions.length?`<h3 class="suggestion-heading">${icon('sparkles')}建议标签 <span class="state-badge">本地规则</span></h3><div class="detail-tags">${suggestions.map(tag=>`<button class="tag suggestion-tag" data-action="accept-tag" data-tag="${escapeHTML(tag)}">${icon('plus')}${escapeHTML(tag)}</button>`).join('')}</div><p class="suggestion-info">根据文件名与链接推测，点击才会添加。视觉 AI 尚未连接。</p>`:''}`;
    hydrateIcons();restoreFocus(focused,'#tagForm input');
  }
  async function toggleFavorite(id) {
    if(!getAsset(id))return;
    await saveChanges([{kind:'favorite',entity:'asset',id}],{key:`favorite:${id}`,onSuccess:()=>{
      const a=getAsset(id),button=$('.details-actions [data-action="favorite"]');
      if(modalKind==='detail'&&selectedAsset===id&&button&&a){button.classList.toggle('selected',a.favorite);button.setAttribute('aria-label',a.favorite?'取消收藏此素材':'收藏此素材');button.setAttribute('aria-pressed',String(a.favorite));}
    }});
  }
  async function editTag(tag,remove=false) {
    const a=getAsset();tag=tag.trim();if(!a||!tag)return;
    await saveChanges([{kind:'tag',entity:'asset',id:a.id,tag,remove}],{key:`tag:${a.id}:${tag}`,onSuccess:()=>{
      if(modalKind==='detail'&&selectedAsset===a.id){if($('#tagForm input')?.value.trim()===tag)$('#tagForm input').value='';updateDetailTags();}
    }});
  }
  function newProject() {openDialog(`${modalHeading('给新项目留一个位置','PROJECT / NEW')}<form id="projectForm"><div class="modal-body"><p class="modal-intro">把相关的图片与链接归在一起，让想法有迹可循。</p><label class="field">项目名称<input name="name" placeholder="例如：秋日品牌视觉" maxlength="40" required autofocus></label><label class="field">项目方向<textarea name="note" placeholder="这次想探索什么？"></textarea></label><div class="form-error" id="projectError" role="alert"></div></div><div class="modal-actions"><button type="button" class="button" data-action="close-modal">取消</button><button class="button primary" type="submit">创建项目 ${icon('arrow-right')}</button></div></form>`);}
  function showEditor() {
    const a=getAsset();if(!a?.src)return;
    editor={brightness:100,contrast:100,saturation:100,grayscale:0};
    openDialog(`${modalHeading('图像工作室','IMAGE STUDIO / LOCAL EDITOR',`<button class="button ghost" data-action="back-detail">返回素材</button>`)}<div class="detail-layout"><div class="detail-preview"><img id="editPreview" src="${escapeHTML(a.src)}" alt="${escapeHTML(a.name)}的编辑预览"><span class="preview-caption">EDIT A COPY / 保留原图</span></div><div class="detail-info"><div class="service-heading">${icon('sliders-horizontal')}<div><h3>给灵感一点新变化</h3><p class="suggestion-info">实时调整图片，保存为一份新的素材。</p></div></div><div class="editor-presets"><button class="button active" data-action="preset" data-preset="original">原图</button><button class="button" data-action="preset" data-preset="soft">柔和</button><button class="button" data-action="preset" data-preset="film">胶片感</button><button class="button" data-action="preset" data-preset="mono">黑白</button></div><div class="editor-controls">${[['brightness','亮度',50,150],['contrast','对比度',50,150],['saturation','饱和度',0,200]].map(([key,label,min,max])=>`<label class="slider-field">${label}<output class="mono" id="${key}Value">100%</output><input type="range" min="${min}" max="${max}" value="100" data-editor="${key}" aria-label="${label}"></label>`).join('')}</div><div class="inline-notice">${icon('sparkles')}<div><strong>AI 创作能力 · 等待接入</strong><br>智能抠图、局部重绘与超分辨率需要连接图像模型。当前调整由浏览器本地完成。</div></div><div class="detail-button-row" style="margin-top:var(--sp-5)"><button class="button primary" data-action="save-edit">${icon('check')}保存为新素材</button><button class="button" data-action="export-edit">${icon('download')}导出 PNG</button></div><p class="helper-note">导出处理单边最多 2400px。GIF 保存为当前静态帧。</p></div></div>`,'detail-dialog');
    modalKind='editor';
  }
  function editorFilter(settings=editor){return `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale}%)`;}
  function updateEditor(){if(!editor)return;$('#editPreview').style.filter=editorFilter();for(const key of ['brightness','contrast','saturation']){$(`[data-editor="${key}"]`).value=editor[key];$(`#${key}Value`).textContent=`${editor[key]}%`;}}
  async function editedImage(asset, settings) {
    const image=await loadImage(asset.src),scale=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const ctx=canvas.getContext('2d');ctx.filter=editorFilter(settings);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    return {src:canvas.toDataURL('image/png'),width:canvas.width,imageHeight:canvas.height};
  }
  async function saveEdit(downloadOnly=false) {
    if(!editor||!getAsset())return;
    const a=structuredClone(getAsset()),settings={...editor};
    const buttons=$$('[data-action="save-edit"],[data-action="export-edit"]');buttons.forEach(b=>b.disabled=true);
    try{const result=await editedImage(a,settings);
      if(!result.src.startsWith('data:image/png;base64,')||result.src.length<100)throw new Error('empty-export');
      if(downloadOnly){download(result.src,`${a.name}-edit.png`);toast('PNG 已生成，开始下载');}
      else{const newAsset={...a,...result,id:uid(),name:`${a.name} · 编辑版`,format:'PNG',kind:'image',sample:false,url:undefined,coverNote:undefined,bytes:Math.round(result.src.length*.75),tags:[...a.tags],created:Date.now()};delete newAsset._revision;delete newAsset.backupOrigin;await saveChanges([{kind:'add',entity:'asset',record:newAsset}],{key:`edit:${a.id}`,onSuccess:()=>{if(modalKind==='editor'&&selectedAsset===a.id)openDetail(newAsset.id);toast('已保存编辑版，原图仍保留');}});}
    }catch(error){toast('处理失败：图片可能不允许跨站读取。请下载后重新导入。','error');}
    finally{buttons.forEach(b=>{if(b.isConnected)b.disabled=false;});}
  }
  function download(url,name){const anchor=document.createElement('a');anchor.href=url;anchor.download=name.replace(/[\\/:*?"<>|]/g,'-');anchor.rel='noopener';document.body.append(anchor);anchor.click();anchor.remove();}
  async function downloadAsset(id) {
    const a=getAsset(id);if(!a?.src)return;
    try {
      const response=await fetch(a.src);if(!response.ok)throw new Error('download');
      const blob=await response.blob();if(!blob.size)throw new Error('empty-download');
      const formats={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/svg+xml':'svg'};
      const suffix=formats[blob.type.split(';')[0].toLowerCase()];
      if(!suffix)throw new Error('unknown-image-format');
      const url=URL.createObjectURL(blob);download(url,`${a.name}.${suffix}`);
      setTimeout(()=>URL.revokeObjectURL(url),10000);toast(`${suffix.toUpperCase()} 已准备好，开始下载`);
    } catch {toast('图片下载未完成。请通过素材来源打开原图后重试。','error');}
  }
  function showFigma(){const a=getAsset();openDialog(`${modalHeading('把灵感带进 Figma','CONNECT / FIGMA')}<div class="modal-body"><div class="service-heading">${icon('figma')}<div><h3>从收藏，走向创作。</h3><p class="suggestion-info">打开设计文件，继续你的工作。</p></div></div><form id="figmaForm"><label class="field">Figma 文件链接<input name="url" type="url" value="${escapeHTML(data.settings.figmaURL)}" placeholder="https://www.figma.com/design/…"><small>保存后，下次可以直接打开同一份设计文件。</small></label><p class="form-error" id="figmaError" role="alert"></p><button class="button" type="submit">保存项目链接</button></form><p class="helper-note">打开 Figma 不会自动插入图片。可先下载素材，再拖进 Figma 画布；自动插入需要后续开发 Figma 插件。</p></div><div class="modal-actions">${a?.src?`<button class="button" data-action="download-asset" data-id="${escapeHTML(a.id)}">${icon('download')}下载素材</button>`:''}<a class="button primary" id="figmaLink" href="${escapeHTML(data.settings.figmaURL||'https://www.figma.com/files')}" target="_blank" rel="noopener noreferrer">打开 Figma ${icon('arrow-up-right')}</a></div>`);}
  function showConnection(){openDialog(`${modalHeading('连接你的创作工具','CONNECTIONS / STATUS')}<div class="modal-body"><p class="modal-intro">这是粒子的 HTML 原型。当前素材保存在这个浏览器中；电脑和手机可以查看同一套界面，素材跨设备同步需要云端服务。</p><div class="connection-list"><div class="connection-row">${icon('hard-drive')}<div><strong>浏览器本地素材库</strong><p>IndexedDB · ${data.assets.length} 个素材 / ${data.projects.length} 个项目</p></div><span class="state-badge ${persistent?'ready':''}">${persistent?'已启用':'保存异常'}</span></div><div class="connection-row">${icon('cloud')}<div><strong>云端存储与多端同步</strong><p>账号、对象存储与同步 API 待接入</p></div><span class="state-badge">未连接</span></div><div class="connection-row">${icon('scan-eye')}<div><strong>AI 图片理解与标签推荐</strong><p>当前使用文件名规则，视觉模型待接入</p></div><span class="state-badge">本地规则</span></div><div class="connection-row">${icon('wand-sparkles')}<div><strong>AI 图片编辑</strong><p>本地调色可用，生成式编辑待接入</p></div><span class="state-badge">部分可用</span></div></div><div class="helper-note">${icon('smartphone')}在手机访问部署后的网址即可使用移动布局；当前版本的数据按浏览器分别保存。</div></div><div class="modal-actions"><button class="button" data-action="extension">${icon('puzzle')}浏览器扩展</button><button class="button ink" data-action="close-modal">知道了</button></div>`);}
  function showExtension(){openDialog(`${modalHeading('看到喜欢的，右键收好','COLLECTOR / BROWSER EXTENSION')}<div class="modal-body"><div class="service-heading">${icon('puzzle')}<div><h3>粒子采集助手</h3><p class="suggestion-info">Chrome / Edge · 本地开发版</p></div></div><div class="inline-notice">${icon('info')}<div>已提供可加载的扩展源码。右键图片、链接或网页，选择“保存到粒子”，即可在当前素材库中确认收集。</div></div><ol class="steps"><li><span class="step-number">01 /</span><div><strong>打开工作台</strong>保持当前页面可以访问。当前工作台地址：<code>${escapeHTML(new URL('./',location.href).href)}</code>。</div></li><li><span class="step-number">02 /</span><div><strong>加载采集助手</strong>下载并解压扩展。打开 <code>chrome://extensions</code> 或 <code>edge://extensions</code>，开启开发者模式，点击“加载已解压的扩展程序”。</div></li><li><span class="step-number">03 /</span><div><strong>设置地址并开始收集</strong>选中解压后的扩展文件夹，在扩展弹窗里把工作台地址设为上方地址，再从普通网页右键收集。</div></li></ol><p class="helper-note">图片仍可能受原站防盗链限制。跨站完整截图、批量采集、登录与云同步属于下一阶段。</p></div><div class="modal-actions"><button class="button" data-action="import-tab" data-tab="link">先手动保存链接</button><a class="button primary" href="particle-extension.zip" download>下载采集扩展 ${icon('download')}</a></div>`);}
  async function removeAsset(id) {
    const asset=getAsset(id);if(!asset)return;
    await saveChanges([{kind:'trash',entity:'asset',id,revision:asset._revision,at:Date.now()}],{key:`trash:${id}`,onSuccess:()=>{
      if(modal.open&&selectedAsset===id)closeDialog();
      toast('素材已移入回收站','',{label:'撤销',run:()=>restoreTrash(id)});
    }});
  }
  function assetMenu(id,x,y){const a=getAsset(id);if(!a)return;const menu=$('#contextMenu');menu.innerHTML=`<button role="menuitem" data-action="detail" data-id="${escapeHTML(id)}">${icon('maximize-2')}查看素材</button><button role="menuitem" data-action="favorite" data-id="${escapeHTML(id)}">${icon('star')}${a.favorite?'取消收藏':'加入收藏'}</button>${a.src?`<button role="menuitem" data-action="download-asset" data-id="${escapeHTML(id)}">${icon('download')}下载图片</button>`:''}<button class="danger" role="menuitem" data-action="delete-asset" data-id="${escapeHTML(id)}">${icon('trash-2')}移除素材</button>`;menu.hidden=false;menu.style.left=`${Math.max(8,Math.min(x,innerWidth-205))}px`;menu.style.top=`${Math.max(8,Math.min(y,innerHeight-200))}px`;hydrateIcons();$('button',menu).focus();}
  function renderTrash() {
    const focused=focusIdentity();
    const base=data.trash.filter(a=>!query||`${a.name} ${a.tags.join(' ')} ${a.notes} ${a.url||''}`.toLowerCase().includes(query.toLowerCase()));
    const list=base.filter(a=>typeFilter==='all'||a.kind===typeFilter);
    $('#main').innerHTML=`<div class="page-heading"><div><h1>回收站 <span class="mono">/ RECYCLE BIN</span></h1><p>暂时放下的灵感，也可以找回来。恢复后回到原项目。</p></div><button class="button" data-action="backup">${icon('archive')}数据与备份</button></div>
      <section aria-label="回收站素材"><div class="library-header"><div class="library-title"><h2>已移除的素材</h2><span>${list.length} 个素材</span></div><span class="muted trash-order">按删除时间排序</span></div>
      <div class="filter-row"><div class="type-filters">${[['all','全部'],['image','图片'],['link','网页链接']].map(([value,label])=>`<button class="filter-chip ${typeFilter===value?'active':''}" data-action="type" data-type="${value}" aria-pressed="${typeFilter===value}">${label}<span class="mono">${value==='all'?base.length:base.filter(a=>a.kind===value).length}</span></button>`).join('')}</div><span class="muted trash-order">仅搜索回收站</span></div>
      <div class="trash-list">${list.map(a=>`<article class="trash-row"><button class="trash-preview" data-action="trash-detail" data-id="${escapeHTML(a.id)}" aria-label="查看已移除的 ${escapeHTML(a.name)}">${assetVisual(a)}</button><div class="trash-copy"><button class="trash-name" data-action="trash-detail" data-id="${escapeHTML(a.id)}">${escapeHTML(a.name)}</button><p>${escapeHTML(a.format||'IMAGE')} · ${new Date(a.deletedAt).toLocaleDateString('zh-CN')} 移除 · ${escapeHTML(data.projects.find(p=>p.id===a.project)?.name||'未分配项目')}</p><p class="trash-note">${escapeHTML(a.notes||a.tags.join(' / ')||'暂无笔记')}</p></div><div class="trash-actions"><button class="button" data-action="restore-trash" data-id="${escapeHTML(a.id)}">${icon('undo-2')}恢复</button><button class="icon-button danger" data-action="purge-trash" data-id="${escapeHTML(a.id)}" aria-label="永久删除 ${escapeHTML(a.name)}">${icon('trash-2')}</button></div></article>`).join('')||`<div class="no-results">${icon(query?'search-x':'trash-2')}<h2>${query||typeFilter!=='all'?'没有匹配的已移除素材':'回收站是空的'}</h2><p>${query||typeFilter!=='all'?'试试其他关键词，或清除筛选。':'从素材库移除的内容会先保留在这里。'}</p><button class="button" data-action="${query||typeFilter!=='all'?'clear-filters':'navigate'}" data-route="library">${query||typeFilter!=='all'?'清除筛选':'返回素材库'}</button></div>`}</div>
      <div class="sample-note">${icon('info')}回收站保存在当前浏览器；整库备份也会包含这里的图片与笔记。</div></section>`;
    hydrateIcons();restoreFocus(focused,'#main');
  }
  function openTrashDetail(id) {
    const a=data.trash.find(a=>a.id===id);
    if(!a){toast('这份素材已离开回收站，请刷新列表。');return;}
    openDialog(`${modalHeading(a.name,'RECYCLE BIN / PREVIEW')}<div class="detail-layout"><div class="detail-preview">${assetVisual(a)}<span class="preview-caption">已移入回收站 · 只读预览</span></div><div class="detail-info"><div class="detail-section"><h3>原有归集</h3><dl class="metadata-grid"><dt>项目</dt><dd>${escapeHTML(data.projects.find(p=>p.id===a.project)?.name||'未分配项目')}</dd><dt>移除时间</dt><dd>${new Date(a.deletedAt).toLocaleString('zh-CN')}</dd><dt>类型</dt><dd>${escapeHTML(a.format||'IMAGE')}</dd><dt>收藏</dt><dd>${a.favorite?'已收藏':'未收藏'}</dd></dl></div><div class="detail-section"><h3>标签</h3><div class="detail-tags">${a.tags.map(tag=>`<span class="tag">${escapeHTML(tag)}</span>`).join('')||'<span class="muted">暂无标签</span>'}</div></div><div class="detail-section"><h3>素材笔记</h3><p class="preserved-note">${escapeHTML(a.notes||'暂无笔记')}</p>${safeURL(a.url||a.source)?`<p class="helper-note"><a href="${escapeHTML(safeURL(a.url||a.source))}" target="_blank" rel="noopener noreferrer">打开素材来源 ↗</a></p>`:''}</div></div></div><div class="modal-actions"><button class="button danger" data-action="purge-trash" data-id="${escapeHTML(id)}">永久删除</button><button class="button primary" data-action="restore-trash" data-id="${escapeHTML(id)}">${icon('undo-2')}恢复到素材库</button></div>`,'detail-dialog');
    modalKind='trash-detail';
  }
  async function restoreTrash(id) {
    const asset=data.trash.find(a=>a.id===id);if(!asset){toast('素材已不在回收站，请核对列表。');return;}
    await saveChanges([{kind:'restore-trash',entity:'trash',id,revision:asset._revision}],{key:`restore-trash:${id}`,onSuccess:()=>{
      if(modalKind==='trash-detail'||modalKind==='purge-trash')closeDialog();
      toast('已恢复素材、笔记和原项目归集');
    }});
  }
  function confirmPurge(id) {
    const a=data.trash.find(a=>a.id===id);if(!a)return;
    openDialog(`${modalHeading('永久删除这份素材？','RECYCLE BIN / DELETE')}<div class="modal-body"><p class="purge-name">${escapeHTML(a.name)}</p><p class="modal-intro">图片、标签和笔记将从当前资料库中移除，无法在回收站撤销。已经下载的备份文件仍保留原有副本。</p></div><div class="modal-actions"><button class="button" id="cancelPurge">保留素材</button><button class="button danger" id="confirmPurge">永久删除</button></div>`);
    modalKind='purge-trash';$('#cancelPurge').onclick=()=>openTrashDetail(id);$('#cancelPurge').focus();
    $('#confirmPurge').onclick=async event=>{
      const button=event.currentTarget;button.disabled=true;button.textContent='正在删除…';
      await saveChanges([{kind:'delete',entity:'trash',id,revision:a._revision}],{key:`purge:${id}`,onSuccess:()=>{if(modalKind==='purge-trash')closeDialog();toast('已从当前资料库永久删除');},onError:()=>{button.disabled=false;button.textContent='重试永久删除';}});
    };
  }
  const backupCounts=(items)=>`<dl class="backup-stats">${items.map(([label,count])=>`<div><dt>${label}</dt><dd class="mono">${count}</dd></div>`).join('')}</dl>`;
  function backupProgress(message) {
    backupState.progress=message;
    if(modalKind==='backup'&&$('#backupProgress'))$('#backupProgress').textContent=message;
  }
  function showBackup() {
    const state=backupState,blocked=state.busy||saving||failedWrites.size||fieldDrafts.size||!initialized;
    const plan=state.bundle?ParticleBackup.plan(state.bundle,data):null;
    const summary=state.result?.summary;
    openDialog(`${modalHeading('让灵感，有一份备份','DATA / BACKUP & RESTORE')}<div class="modal-body backup-body"><p class="modal-intro">把当前浏览器的图片、链接和项目笔记存成一个文件，也可以带到另一个浏览器恢复。</p>
      ${backupCounts([['素材',data.assets.length],['项目',data.projects.length],['回收站',data.trash.length]])}
      <section class="backup-section" aria-labelledby="exportHeading"><h3 id="exportHeading">01 / 导出整库备份</h3><p>包含已保存的图片、标签、收藏、笔记、项目、Figma 链接与回收站。单文件上限 256 MB。</p><button class="button ${state.result?'':'primary'}" data-action="export-backup" ${blocked?'disabled':''}>${icon('archive')}${state.result?'重新生成备份':'生成完整备份'}</button>
      ${summary?`<div class="backup-result"><p><strong>备份文件已生成 · ${byteLabel(state.result.blob.size)}</strong></p><p>${summary.assets} 个素材 / ${summary.projects} 个项目 / ${summary.trash} 个回收站素材；${summary.embedded} 份图片已嵌入。生成于 ${new Date(state.result.envelope.exportedAt).toLocaleString('zh-CN')}。</p>${summary.remote?`<p class="backup-warning">${summary.remote} 份远程图片无法下载，文件中仅保留引用；这些图片恢复后仍需要联网访问。</p>`:'<p>本地图片与示例封面已随文件保存。</p>'}<button class="button primary" data-action="download-backup" ${state.busy?'disabled':''}>${icon('download')}下载备份文件</button></div>`:''}</section>
      <section class="backup-section" aria-labelledby="restoreHeading"><h3 id="restoreHeading">02 / 从备份恢复</h3><p>先校验，再预览。保留当前内容；遇到不同内容的同 ID 记录时，另存为恢复副本并关联对应项目。</p><label class="field backup-file">选择粒子备份文件<input id="backupFile" type="file" accept=".json,application/json" ${blocked?'disabled':''} aria-describedby="backupFileHelp"></label><p id="backupFileHelp">JSON · 最多 10,000 个素材（含回收站）。校验只检测文件完整性，不认证来源。</p>
      ${state.bundle?`<div class="restore-preview"><h3>恢复预览</h3><p class="backup-filename">${escapeHTML(state.filename)}</p><p>已通过 SHA-256 完整性校验。</p>${backupCounts([['新增素材',plan.summary.assets],['新增项目',plan.summary.projects],['新增回收站',plan.summary.trash]])}<p>${plan.summary.skipped} 条相同记录将跳过；${plan.summary.copies} 条冲突记录将另存副本。${plan.summary.settings?'当前未设置 Figma 链接，将从备份补入。':'当前 Figma 设置保持原样。'}</p>${state.bundle.summary.remote?`<p class="backup-warning">备份中有 ${state.bundle.summary.remote} 份远程图片引用，离线时不可用。</p>`:''}<details><summary>查看备份素材名称${state.bundle.payload.assets.length+state.bundle.payload.trash.length>20?'（前 20 条）':''}</summary><ul class="backup-records">${[...state.bundle.payload.assets,...state.bundle.payload.trash].slice(0,20).map(a=>`<li>${escapeHTML(a.name)}${a.deletedAt?' · 回收站':''}</li>`).join('')}</ul></details><p>恢复时会再次核对当前资料库，实际新增数量以保存结果为准。</p><button class="button primary" data-action="restore-backup" ${blocked||!plan.writes.length?'disabled':''}>${icon('import')}${plan.writes.length?'确认合并恢复':'这些内容已在当前库中'}</button></div>`:''}
      ${state.report?`<div class="backup-result" role="status"><strong>恢复已保存</strong><p>新增 ${state.report.assets} 个素材、${state.report.projects} 个项目、${state.report.trash} 个回收站素材；跳过 ${state.report.skipped} 条已有记录。</p></div>`:''}</section>
      ${!state.busy&&blocked?'<p class="backup-warning">请先完成待保存的修改，或在保存提示中处理异常，再生成或恢复备份。</p>':''}<p id="backupProgress" class="backup-progress" role="status">${escapeHTML(state.progress)}</p><p class="form-error" role="alert">${escapeHTML(state.error)}</p></div><div class="modal-actions"><button class="button" data-action="close-modal">${state.busy?'后台继续，关闭窗口':'关闭'}</button></div>`);
    modalKind='backup';$('#backupFile').onchange=event=>previewBackup(event.target.files[0]);
  }
  async function requireSavedLibrary() {
    await writeChain;
    if(!initialized||failedWrites.size||fieldDrafts.size)throw new Error('请先完成待保存的修改，或处理保存异常。');
    data=await repository.read();return data;
  }
  async function exportBackup() {
    if(backupState.busy)return;
    backupState.busy=true;backupState.error='';backupState.progress='正在读取已保存的资料库…';showBackup();
    try{
      const snapshot=await requireSavedLibrary();
      backupState.result=await ParticleBackup.create(snapshot,progress=>{if(progress.completed!==undefined)backupProgress(`正在打包图片 ${progress.completed} / ${progress.total}…`);});
      backupState.progress='备份已生成。请下载文件，并确认保存在你的设备中。';
    }catch(error){backupState.error=error.message||'备份未生成，请重试。';backupState.progress='';}
    finally{backupState.busy=false;if(modalKind==='backup')showBackup();else toast(backupState.error||'备份已生成，可在“数据与备份”下载',backupState.error?'error':'');}
  }
  function downloadBackup() {
    const result=backupState.result;if(!result)return;
    const url=URL.createObjectURL(result.blob),stamp=result.envelope.exportedAt.slice(0,19).replace(/[:T]/g,'-');
    download(url,`particle-${stamp}.json`);setTimeout(()=>URL.revokeObjectURL(url),30000);
    backupProgress('已发起下载。请检查下载目录；备份生成不等于文件已经保存。');
  }
  async function previewBackup(file) {
    if(!file||backupState.busy)return;
    Object.assign(backupState,{busy:true,bundle:null,report:null,error:'',filename:file.name,progress:'正在校验文件和内嵌图片，资料库尚未改动…'});showBackup();
    try{await requireSavedLibrary();backupState.bundle=await ParticleBackup.parse(file);backupState.progress='校验完成。请核对预览，再确认恢复。';}
    catch(error){backupState.error=error.message;backupState.progress='没有写入任何数据。';}
    finally{backupState.busy=false;if(modalKind==='backup')showBackup();}
  }
  async function restoreBackup() {
    const bundle=backupState.bundle;if(!bundle||backupState.busy)return;
    backupState.busy=true;backupState.error='';backupState.progress='正在合并恢复，请稍候…';showBackup();
    try{
      await requireSavedLibrary();
      const report=await repository.restoreBackup(bundle);
      backupState.report=report;backupState.bundle=null;backupState.progress='恢复已保存，当前内容已保留。';
      try{data=await repository.read();render();}catch{backupState.progress='恢复已保存，但列表刷新失败。请重新加载页面查看。';}
    }catch(error){backupState.error=error.code==='invalid-backup'?error.message:'恢复未完成，原资料库未改动。请检查浏览器存储空间后重试。';backupState.progress='';}
    finally{backupState.busy=false;if(modalKind==='backup')showBackup();else toast(backupState.error||backupState.progress,backupState.error?'error':'');}
  }
  const mobileNavigation=matchMedia('(max-width:700px)');
  function syncSidebarAccess(){
    const open=mobileNavigation.matches&&$('#sidebar').classList.contains('open');
    $('#sidebar').inert=mobileNavigation.matches&&!open;
    $('.app-shell').inert=open;$('.skip-link').inert=open;$('#contextMenu').inert=open;
    if(open){$('#sidebar').setAttribute('role','dialog');$('#sidebar').setAttribute('aria-modal','true');}
    else{$('#sidebar').setAttribute('role','complementary');$('#sidebar').removeAttribute('aria-modal');}
    document.body.classList.toggle('drawer-open',open);
  }
  function closeSidebar(returnFocus=true){const wasOpen=$('#sidebar').classList.contains('open');$('#sidebar').classList.remove('open');$('#sidebarBackdrop').hidden=true;$('[data-action="menu"]').setAttribute('aria-expanded','false');syncSidebarAccess();if(wasOpen&&returnFocus&&mobileNavigation.matches)$('[data-action="menu"]').focus();}
  mobileNavigation.addEventListener('change',()=>{if(!mobileNavigation.matches)closeSidebar();syncSidebarAccess();});
  async function captureFromHash(){
    if(!location.hash.startsWith('#capture?'))return false;
    const params=new URLSearchParams(location.hash.slice(9));const url=safeURL(params.get('url')||''),image=safeURL(params.get('image')||'');
    history.replaceState(null,'','#library');route='library';render();
    if(!url&&!image){toast('采集链接无效，只接受 HTTP 或 HTTPS 地址。','error');return true;}
    const title=(params.get('title')||hostname(url||image)).slice(0,120),captureID=uid();
    openDialog(`${modalHeading('收到一颗新灵感','COLLECTOR / INCOMING')}<div class="modal-body">${image?`<img src="${escapeHTML(image)}" alt="待收集的图片" style="max-height:300px;margin:0 auto var(--sp-5);object-fit:contain">`:''}<p><strong>${escapeHTML(title)}</strong></p><p class="helper-note">来源：${escapeHTML(hostname(url||image))}</p><p class="helper-note">${image?'确认后尝试将图片下载到本地库；若原站不允许跨域下载，则保存为原图链接。':'确认后保存网页书签。'}</p></div><div class="modal-actions"><button class="button" data-action="close-modal">取消</button><button class="button primary" id="confirmCapture">确认收集</button></div>`);
    $('#confirmCapture').onclick=async e=>{e.target.disabled=true;e.target.textContent='正在收集…';let props={},remote=false;
      if(image){try{const response=await fetch(image);if(!response.ok)throw new Error();const blob=await response.blob();props=await readImage(new File([blob],'collected-image',{type:blob.type}));}catch{props={src:image,format:'IMAGE'};remote=true;}}
      const a={id:captureID,name:title,kind:image?'image':'link',format:image?'IMAGE':'URL',...props,url:image?undefined:url,source:url,tags:[],notes:remote?'当前保留原图链接，离线不可用。可下载图片后重新导入。':'',project:'',favorite:false,created:Date.now(),height:220};
      await saveChanges([{kind:'add',entity:'asset',record:a}],{key:`capture:${a.id}`,onSuccess:()=>{openDetail(a.id);toast(remote?'已保存原图链接；原站限制了本地下载':'已收集到素材库');},onError:()=>{if(e.target.isConnected){e.target.disabled=false;e.target.textContent='重试收集';}}});};return true;
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!event.target.closest('#contextMenu'))$('#contextMenu').hidden=true;if(!button)return;
    const action=button.dataset.action,id=button.dataset.id;
    if(button.tagName==='A'){if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();}
    if(action!=='asset-menu')$('#contextMenu').hidden=true;
    switch(action){
      case'navigate':navigate(button.dataset.route);break;
      case'project':navigate('project',id);break;
      case'tag-filter':navigate('tag','',button.dataset.tag);break;
      case'clear-tag':tagFilter='';if(route==='tag'){route='library';history.replaceState(null,'','#library');}render();break;
      case'type':typeFilter=button.dataset.type;route==='trash'?renderTrash():renderGrid();break;
      case'view':view=button.dataset.view;render();break;
      case'clear-filters':query='';$('#search').value='';typeFilter='all';tagFilter='';if(route==='tag'){route='library';history.replaceState(null,'','#library');}render();break;
      case'search-all':searchScope='all';render();break;
      case'retry-save':await retrySaves();break;
      case'resolve-save':await resolveFailedSave();break;
      case'import':openImport();break;
      case'import-tab':openImport(button.dataset.tab);break;
      case'choose-file':$('#quickUpload').click();break;
      case'close-modal':closeDialog();break;
      case'detail':openDetail(id);break;
      case'favorite':await toggleFavorite(id);break;
      case'accept-tag':await editTag(button.dataset.tag);break;
      case'remove-tag':await editTag(button.dataset.tag,true);break;
      case'new-project':newProject();break;
      case'edit-image':showEditor();break;
      case'back-detail':openDetail(selectedAsset);break;
      case'preset':{const p=button.dataset.preset;editor={brightness:p==='soft'?108:p==='film'?104:100,contrast:p==='soft'?92:p==='film'?112:100,saturation:p==='film'?75:p==='soft'?88:100,grayscale:p==='mono'?100:0};$$('[data-action="preset"]').forEach(b=>b.classList.toggle('active',b===button));updateEditor();break;}
      case'save-edit':await saveEdit();break;
      case'export-edit':await saveEdit(true);break;
      case'download-asset':await downloadAsset(id);break;
      case'figma':showFigma();break;
      case'connection':showConnection();break;
      case'backup':showBackup();break;
      case'export-backup':await exportBackup();break;
      case'download-backup':downloadBackup();break;
      case'restore-backup':await restoreBackup();break;
      case'trash-detail':openTrashDetail(id);break;
      case'restore-trash':await restoreTrash(id);break;
      case'purge-trash':confirmPurge(id);break;
      case'extension':showExtension();break;
      case'delete-asset':removeAsset(id);break;
      case'asset-menu':{const box=button.getBoundingClientRect();assetMenu(id,box.right-190,box.bottom+4);break;}
      case'menu':{const open=$('#sidebar').classList.toggle('open');$('#sidebarBackdrop').hidden=!open;button.setAttribute('aria-expanded',String(open));syncSidebarAccess();if(open)$('#sidebar .brand').focus();break;}
      case'close-menu':closeSidebar();break;
    }
  });
  document.addEventListener('submit',async e=>{
    const form=e.target;if(!['linkForm','tagForm','projectForm','figmaForm'].includes(form.id))return;e.preventDefault();
    if(form.id==='linkForm')await addLink(form);
    if(form.id==='tagForm')await editTag(form.elements.tag.value);
    if(form.id==='projectForm'){
      const name=form.elements.name.value.trim();if(!name){$('#projectError').textContent='请填写项目名称。';return;}
      if(data.projects.some(p=>p.name===name)){$('#projectError').textContent='已经有一个同名项目，换一个名字吧。';return;}
      const at=Date.now(),p={id:form.dataset.projectId||uid(),name,note:form.elements.note.value.trim(),color:data.projects.length%3+1,created:at,updatedAt:at,lastOpenedAt:at};
      form.dataset.projectId=p.id;const button=$('button[type="submit"]',form);button.disabled=true;
      await saveChanges([{kind:'add',entity:'project',record:p}],{key:`new-project:${p.id}`,onSuccess:()=>{if(form.isConnected){closeDialog();navigate('project',p.id);}toast('项目已创建，可以开始添加素材了');},onError:()=>{button.disabled=false;}});
    }
    if(form.id==='figmaForm'){
      const url=safeURL(form.elements.url.value.trim());if(!url||!(new URL(url).hostname==='figma.com'||new URL(url).hostname.endsWith('.figma.com'))){$('#figmaError').textContent='请使用 figma.com 的有效文件或项目链接。';return;}
      const button=$('button[type="submit"]',form);button.disabled=true;
      await saveChanges([{kind:'patch',entity:'settings',changes:{figmaURL:url},expected:{figmaURL:form.elements.url.defaultValue}}],{key:'settings:figmaURL',onSuccess:()=>{if(form.isConnected){$('#figmaLink').href=url;form.elements.url.defaultValue=url;$('#figmaError').textContent='';button.disabled=false;}toast('Figma 项目链接已保存');},onError:()=>{button.disabled=false;}});
    }
  });
  document.addEventListener('input',e=>{if(e.target.dataset.editor&&editor){editor[e.target.dataset.editor]=Number(e.target.value);$$('[data-action="preset"]').forEach(b=>b.classList.remove('active'));updateEditor();}});
  $('#search').addEventListener('input',e=>{query=e.target.value.trim();render();});
  $('#quickUpload').addEventListener('change',e=>importFiles(e.target.files));
  $('#sidebarBackdrop').addEventListener('click',closeSidebar);
  modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  modal.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(modal.open)closeDialog();closeSidebar(false);$('#search').focus();}
    if(e.key==='Escape'&&!modal.open){$('#contextMenu').hidden=true;closeSidebar();}
    if(e.key==='Tab'&&mobileNavigation.matches&&$('#sidebar').classList.contains('open')&&!modal.open){
      const targets=$$('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]',$('#sidebar')).filter(el=>el.getClientRects().length);
      const first=targets[0],last=targets[targets.length-1],active=document.activeElement;
      if(e.shiftKey&&(active===first||!$('#sidebar').contains(active))){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&(active===last||!$('#sidebar').contains(active))){e.preventDefault();first?.focus();}
    }
    if(!modal.open&&e.code==='Space'&&document.activeElement?.matches('.asset-open')){e.preventDefault();openDetail(document.activeElement.dataset.id);}
    if(!$('#contextMenu').hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=$$('button',$('#contextMenu')),index=items.indexOf(document.activeElement);items[(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}
  });
  document.addEventListener('contextmenu',e=>{const card=e.target.closest('[data-asset]');if(card){e.preventDefault();assetMenu(card.dataset.asset,e.clientX,e.clientY);}});
  document.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();dragCounter++;$('#dropOverlay').hidden=false;}});
  document.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault();});
  document.addEventListener('dragleave',()=>{dragCounter=Math.max(0,dragCounter-1);if(!dragCounter)$('#dropOverlay').hidden=true;});
  document.addEventListener('drop',e=>{if(e.dataTransfer.files.length){e.preventDefault();dragCounter=0;$('#dropOverlay').hidden=true;if(modalKind==='backup'&&e.dataTransfer.files.length===1&&e.dataTransfer.files[0].name.endsWith('.json'))previewBackup(e.dataTransfer.files[0]);else importFiles(e.dataTransfer.files);}});
  document.addEventListener('paste',e=>{const files=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));if(files.length){e.preventDefault();importFiles(files);}});
  window.addEventListener('beforeunload',e=>{if(saving||failedWrites.size||fieldDrafts.size||backupState.busy){e.preventDefault();e.returnValue='';}});
  document.addEventListener('error',e=>{const img=e.target;if(img.tagName==='IMG'&&!img.dataset.fallback){img.dataset.fallback='true';const parent=img.parentElement;if(parent.classList.contains('asset-visual')||parent.classList.contains('detail-preview')){const fallback=document.createElement('div');fallback.className='bookmark-cover';fallback.innerHTML=`${icon('image-off')}<strong>原图暂时无法加载</strong><span>可在素材详情查看来源链接</span>`;img.replaceWith(fallback);hydrateIcons();}else{img.src='assets/form-study.svg';}}},true);
  window.addEventListener('hashchange',async()=>{if(location.hash==='#main')return;if(await captureFromHash())return;const [next,id]=location.hash.slice(1).split('/');if(next==='project')navigate('project',decodeURIComponent(id||''));else if(next==='tag')navigate('tag','',decodeURIComponent(id||''));else navigate(['workspace','library','recent','favorites','trash'].includes(next)?next:'workspace');});
  async function init(){syncSidebarAccess();await loadData();if(await captureFromHash())return;const [next,id]=location.hash.slice(1).split('/');if(next==='project'&&data.projects.some(p=>p.id===decodeURIComponent(id||''))){route='project';activeProject=decodeURIComponent(id);}else if(next==='tag'){route='tag';tagFilter=decodeURIComponent(id||'');}else route=['workspace','library','recent','favorites','trash'].includes(next)?next:'workspace';render();}
  init();
})();
