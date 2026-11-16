/* Portable backups: strict data validation, embedded media, atomic merge planning. */
(() => {
  'use strict';
  const MAX_FILE_BYTES = 256 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
  const MAX_ITEMS = 10000;
  const verifiedBundles = new WeakSet();
  const imagePattern = /^data:image\/(png|jpeg|webp|gif|avif|svg\+xml);base64,([A-Za-z0-9+/]*={0,2})$/;
  const localPattern = /^assets\/[a-zA-Z0-9._-]+\.(?:png|jpe?g|webp|gif|avif|svg)$/i;
  const formats = new Set(['image/png','image/jpeg','image/webp','image/gif','image/avif','image/svg+xml']);
  const formatLabels = new Set(['PNG','JPG','JPEG','WEBP','GIF','AVIF','SVG','URL','IMAGE']);
  const fail = message => { throw new Error(message); };
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const http = value => { try { return ['http:','https:'].includes(new URL(value).protocol); } catch { return false; } };
  const text = (value, label, max = 200000, fallback = '') => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || value.length > max) fail(`${label}不是有效文本，或长度超出限制。`);
    return value;
  };
  const number = (value, label, max = Number.MAX_SAFE_INTEGER, fallback = 0) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) fail(`${label}不是有效数值。`);
    return value;
  };
  const boolean = (value, label) => { if (value === undefined) return false; if (typeof value !== 'boolean') fail(`${label}不是有效状态。`); return value; };
  const id = value => {
    const result = text(value, '记录 ID', 160);
    if (!result || !/^[A-Za-z0-9_.-]+$/.test(result)) fail('备份中存在无效的记录 ID。');
    return result;
  };
  function dataImage(value) {
    if (typeof value !== 'string' || value.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 100) return false;
    const match = value.match(imagePattern);
    return !!match && match[2].length > 0 && match[2].length % 4 === 0;
  }
  function optionalURL(value, label) {
    const result = text(value, label, 16000);
    if (result && !http(result)) fail(`${label}必须是 HTTP 或 HTTPS 地址。`);
    return result;
  }
  function normalizeAsset(value, trashed = false) {
    if (!isObject(value)) fail('素材记录格式不正确。');
    if (!['image','link'].includes(value.kind)) fail('备份包含不支持的素材类型。');
    if (!Array.isArray(value.tags) || value.tags.length > 256) fail('标签列表格式不正确。');
    const src = value.src === undefined ? '' : value.src;
    if(typeof src!=='string')fail('图片来源必须是文本。');
    if (src && !(dataImage(src) || http(src) || (typeof src === 'string' && localPattern.test(src)))) fail('图片来源格式不正确。');
    if (value.kind === 'image' && !src) fail('图片素材缺少图像内容。');
    const embeddedSrc = value.embeddedSrc === undefined ? '' : value.embeddedSrc;
    if(typeof embeddedSrc!=='string')fail('内嵌图片必须是有效的数据地址。');
    if (embeddedSrc && !dataImage(embeddedSrc)) fail('备份中的图片数据损坏或格式不受支持。');
    if (localPattern.test(src) && !embeddedSrc) fail('备份缺少本地图片文件，无法完整恢复。');
    const result = {
      id:id(value.id), name:text(value.name,'素材名称',300), kind:value.kind,
      format:text(value.format,'文件格式',24,'IMAGE'), tags:[...new Set(value.tags.map(t=>text(t,'标签',100)))],
      project:value.project ? id(value.project) : '', favorite:boolean(value.favorite,'收藏状态'),
      notes:text(value.notes,'素材笔记'), created:number(value.created,'添加时间'),
      height:number(value.height,'卡片高度',600,215), sample:boolean(value.sample,'示例状态')
    };
    if (!result.name.trim()) fail('备份中有缺少名称的素材。');
    if(!formatLabels.has(result.format))fail('备份包含不支持的文件格式标记。');
    if (src) result.src = src;
    if (embeddedSrc) result.embeddedSrc = embeddedSrc;
    for (const key of ['url','source']) { const url=optionalURL(value[key],key==='url'?'网页链接':'来源地址'); if(url)result[key]=url; }
    if (result.kind==='link'&&!result.url) fail('网页素材缺少有效链接。');
    for (const key of ['width','imageHeight','bytes']) if(value[key]!==undefined)result[key]=number(value[key],key,key==='bytes'?MAX_IMAGE_BYTES:1000000);
    for (const key of ['coverNote','coverFormat']) if(value[key]!==undefined)result[key]=text(value[key],key,1000);
    if(result.coverFormat&&!formatLabels.has(result.coverFormat))fail('备份包含不支持的封面格式标记。');
    if (trashed) { result.deletedAt=number(value.deletedAt,'删除时间'); if(!result.deletedAt)fail('回收站记录缺少删除时间。'); }
    return result;
  }
  function normalizeProject(value) {
    if (!isObject(value)) fail('项目记录格式不正确。');
    const project={id:id(value.id),name:text(value.name,'项目名称',300),note:text(value.note,'项目笔记'),color:number(value.color,'项目颜色',3,1)};
    if (!project.name.trim()||![1,2,3].includes(project.color)) fail('项目名称或颜色无效。');
    for (const key of ['created','updatedAt','lastOpenedAt','order']) if(value[key]!==undefined)project[key]=number(value[key],key);
    return project;
  }
  function validatePayload(payload) {
    if (!isObject(payload)) fail('备份内容不是有效的资料库。');
    for (const key of ['assets','trash','projects']) if(!Array.isArray(payload[key])||payload[key].length>MAX_ITEMS)fail('备份记录列表无效，或超过 10,000 条上限。');
    if(payload.assets.length+payload.trash.length>MAX_ITEMS)fail('备份素材超过 10,000 条上限。');
    if(!isObject(payload.settings))fail('备份设置格式不正确。');
    const projects=payload.projects.map(normalizeProject), projectIDs=new Set(projects.map(p=>p.id));
    if(projectIDs.size!==projects.length)fail('备份存在重复的项目 ID。');
    const assets=payload.assets.map(a=>normalizeAsset(a)),trash=payload.trash.map(a=>normalizeAsset(a,true));
    const ids=new Set();
    for (const asset of [...assets,...trash]) {
      if(ids.has(asset.id))fail('备份存在重复的素材 ID。');ids.add(asset.id);
      if(asset.project&&!projectIDs.has(asset.project))fail('备份中的素材关联到不存在的项目。');
    }
    const figmaURL=optionalURL(payload.settings.figmaURL,'Figma 地址');
    if(figmaURL){const host=new URL(figmaURL).hostname;if(host!=='figma.com'&&!host.endsWith('.figma.com'))fail('Figma 地址必须属于 figma.com。');}
    return {assets,trash,projects,settings:{figmaURL}};
  }
  async function digest(payload) {
    if (!globalThis.crypto?.subtle) fail('当前网址不支持完整性校验，请使用 HTTPS 或 localhost 地址。');
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
    return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function summarize(payload) {
    const all=[...payload.assets,...payload.trash];
    return {assets:payload.assets.length,trash:payload.trash.length,projects:payload.projects.length,
      embedded:all.filter(a=>dataImage(a.src)||a.embeddedSrc).length,
      remote:all.filter(a=>http(a.src)&&!a.embeddedSrc).length,
      bookmarks:payload.assets.filter(a=>a.kind==='link').length};
  }
  async function verifyImages(payload) {
    const checked=new Set();
    for(const asset of [...payload.assets,...payload.trash])for(const src of [asset.src,asset.embeddedSrc]){
      if(!src?.startsWith('data:')||checked.has(src))continue;
      checked.add(src);
      await new Promise((resolve,reject)=>{
        const image=new Image();
        const finish=ok=>{clearTimeout(timer);image.onload=image.onerror=null;if(ok)resolve();else reject(new Error(`「${asset.name}」的内嵌图片无法解码，资料库未改动。`));};
        const timer=setTimeout(()=>{image.src='';finish(false);},10000);
        image.onload=()=>finish(image.naturalWidth>0&&image.naturalHeight>0);image.onerror=()=>finish(false);image.src=src;
      });
    }
  }
  async function parse(input) {
    let content;
    if(typeof input==='string')content=input;
    else{if(!input||typeof input.text!=='function')fail('请选择粒子备份文件。');if(input.size>MAX_FILE_BYTES)fail('备份文件超过 256 MB，请使用较小的备份文件。');content=await input.text();}
    if(new Blob([content]).size>MAX_FILE_BYTES)fail('备份文件超过 256 MB。');
    let envelope;try{envelope=JSON.parse(content);}catch{fail('文件不是有效的 JSON 备份，原素材库未改动。');}
    if(!isObject(envelope)||envelope.format!=='particle-backup')fail('这不是粒子备份文件。');
    if(envelope.version!==1)fail('暂不支持这个备份版本，请使用兼容的粒子版本。');
    if(!isObject(envelope.integrity)||envelope.integrity.algorithm!=='SHA-256'||!/^[a-f0-9]{64}$/.test(envelope.integrity.digest||''))fail('备份缺少有效的完整性校验信息。');
    const hash=await digest(envelope.payload);
    if(hash!==envelope.integrity.digest)fail('备份完整性校验失败，文件可能不完整或被修改。原素材库未改动。');
    const payload=validatePayload(envelope.payload);
    await verifyImages(payload);
    const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
    const bundle=freeze({payload,digest:hash,exportedAt:text(envelope.exportedAt,'备份时间',100),summary:summarize(payload)});
    verifiedBundles.add(bundle);
    return bundle;
  }
  const blobData = blob => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('图片读取失败。'));reader.readAsDataURL(blob);});
  async function embedAsset(asset, onProgress) {
    const record={...asset,src:asset.backupOrigin||asset.src};
    if(!record.src){delete record.src;return record;}
    if(dataImage(asset.src)){if(record.src!==asset.src)record.embeddedSrc=asset.src;return record;}
    const local=localPattern.test(record.src);
    try{
      const response=await fetch(asset.src,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('fetch');
      const blob=await response.blob();
      if(!formats.has(blob.type.split(';')[0])||!blob.size||blob.size>MAX_IMAGE_BYTES)throw new Error('format');
      record.embeddedSrc=await blobData(blob.slice(0,blob.size,blob.type.split(';')[0]));
    }catch(error){if(local)fail(`无法读取本地图片「${asset.name}」，备份未生成，请检查素材后重试。`);onProgress?.({warning:asset.name});}
    return record;
  }
  async function create(snapshot, onProgress) {
    const total=snapshot.assets.length+(snapshot.trash||[]).length;
    const payload={assets:[],trash:[],projects:snapshot.projects,settings:{figmaURL:snapshot.settings.figmaURL||''}};
    let completed=0;
    for(const key of ['assets','trash'])for(const asset of snapshot[key]||[]){payload[key].push(await embedAsset(asset,onProgress));completed++;onProgress?.({completed,total});}
    const normalized=validatePayload(payload);await verifyImages(normalized);const hash=await digest(normalized);
    const envelope={format:'particle-backup',version:1,exportedAt:new Date().toISOString(),payload:normalized,integrity:{algorithm:'SHA-256',digest:hash}};
    const blob=new Blob([JSON.stringify(envelope)],{type:'application/json'});
    if(blob.size>MAX_FILE_BYTES)fail('当前备份超过 256 MB，暂不支持单文件导出。');
    return {blob,envelope,summary:summarize(normalized)};
  }
  function sameProject(a,b){return ['name','note','color'].every(key=>(a[key]??'')===(b[key]??''));}
  function sameAsset(a,b){
    const keys=['name','kind','format','project','favorite','notes','source','url','coverNote','coverFormat','deletedAt'];
    if(!keys.every(key=>(a[key]??(key==='favorite'?false:''))===(b[key]??(key==='favorite'?false:''))))return false;
    if(JSON.stringify([...(a.tags||[])].sort())!==JSON.stringify([...(b.tags||[])].sort()))return false;
    // Equal URLs are not proof of equal image bytes. Keep the embedded copy when
    // the current record still points to a local/remote file instead of bytes.
    return (a.src||'')===(b.embeddedSrc||b.src||'');
  }
  function materialize(asset,idValue,project){
    const result={...asset,id:idValue,project,src:asset.embeddedSrc||asset.src};
    if(asset.embeddedSrc)result.backupOrigin=asset.src;
    delete result.embeddedSrc;
    if(!result.src)delete result.src;
    return result;
  }
  function plan(bundle,current) {
    const payload=bundle.payload, prefix=`recovered-${bundle.digest.slice(0,16)}`;
    const projectMap=new Map(), projects=new Map(current.projects.map(p=>[p.id,p]));
    const live=new Map(current.assets.map(a=>[a.id,a])), trash=new Map((current.trash||[]).map(a=>[a.id,a]));
    const deleted=new Set(current.deletedIDs||[]);
    const writes=[],summary={assets:0,trash:0,projects:0,skipped:0,copies:0,settings:0};
    const choose=(original,fallback,occupied,matches)=>{
      if(!occupied(original)||matches(original))return original;
      let attempt=0,candidate=fallback;
      while(occupied(candidate)&&!matches(candidate)){attempt++;candidate=`${fallback}-${attempt}`;}
      return candidate;
    };
    payload.projects.forEach((project,index)=>{
      const key=choose(project.id,`${prefix}-p-${index}`,id=>projects.has(id),id=>sameProject(projects.get(id),project));
      projectMap.set(project.id,key);
      if(projects.has(key)){summary.skipped++;return;}
      const record={...project,id:key};projects.set(key,record);writes.push({entity:'project',record});summary.projects++;
      if(key!==project.id)summary.copies++;
    });
    for(const entity of ['asset','trash']){
      const source=entity==='asset'?payload.assets:payload.trash,target=entity==='asset'?live:trash;
      source.forEach((asset,index)=>{
        const project=asset.project?projectMap.get(asset.project):'',mapped={...asset,project};
        const key=choose(asset.id,`${prefix}-${entity==='asset'?'a':'t'}-${index}`,id=>live.has(id)||trash.has(id)||deleted.has(id),id=>target.has(id)&&sameAsset(target.get(id),mapped));
        if(target.has(key)){summary.skipped++;return;}
        const record=materialize(asset,key,project);target.set(key,record);writes.push({entity,record});summary[entity==='asset'?'assets':'trash']++;
        if(key!==asset.id)summary.copies++;
      });
    }
    if(!current.settings.figmaURL&&payload.settings.figmaURL){writes.push({entity:'settings',record:{...current.settings,figmaURL:payload.settings.figmaURL}});summary.settings=1;}
    return {writes,summary};
  }
  globalThis.ParticleBackup={create,parse,plan,validatePayload,digest,summarize,isVerified:bundle=>verifiedBundles.has(bundle),MAX_FILE_BYTES};
})();
