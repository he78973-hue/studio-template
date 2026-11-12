(async()=>{
  'use strict';
  const output=document.getElementById('results'),results=[],stores=[];
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const test=async(label,action)=>{try{await action();results.push({label,pass:true});}catch(error){results.push({label,pass:false,error:error.message});}output.textContent=results.map(r=>`${r.pass?'PASS':'FAIL'} ${r.label}${r.error?': '+r.error:''}`).join('\n');};
  const rejects=async(promise,code)=>{try{await promise;}catch(error){if(code)assert(error.code===code,`Expected ${code}, got ${error.code||error.name}`);return error;}throw new Error('Expected operation to reject');};
  const empty=()=>({assets:[],projects:[],settings:{figmaURL:''}});
  const fresh=async(seed=empty())=>{const store=new ParticleStore(`particle-backup-test-${crypto.randomUUID()}`);stores.push(store);await store.open(()=>seed);return store;};
  const canvas=document.createElement('canvas');canvas.width=4;canvas.height=3;canvas.getContext('2d').fillRect(0,0,4,3);const png=canvas.toDataURL('image/png');
  const asset=(id,extra={})=>({id,name:id,kind:'image',format:'PNG',src:png,tags:['品牌','中文'],favorite:true,notes:'第一行\n保留笔记 & <文本>',project:'p',created:1000,height:200,width:4,imageHeight:3,...extra});
  const seed={assets:[asset('upload'),asset('local-svg',{src:'assets/brand-study.svg',format:'SVG'}),asset('bookmark',{kind:'link',format:'URL',url:'https://example.com/reference',src:undefined,notes:'网页笔记'}),asset('removed')],projects:[{id:'p',name:'完整项目',note:'原项目方向',color:1,created:800}],settings:{figmaURL:'https://www.figma.com/design/backup'}};
  const source=await fresh(seed),target=await fresh();
  await source.mutate([{kind:'trash',entity:'asset',id:'removed',at:2000}]);
  let backup,bundle;
  await test('Export embeds local SVG, original image bytes, bookmarks and trash metadata',async()=>{
    backup=await ParticleBackup.create(await source.read());
    bundle=await ParticleBackup.parse(backup.blob);
    assert(backup.blob.size>1000,'Backup is empty');
    assert(bundle.payload.assets.find(a=>a.id==='local-svg').embeddedSrc.startsWith('data:image/svg+xml;base64,'),'Local SVG not embedded');
    assert(bundle.payload.assets.find(a=>a.id==='upload').src===png,'Image bytes changed');
    assert(bundle.payload.trash[0].deletedAt===2000&&bundle.payload.trash[0].notes===seed.assets[3].notes,'Trash metadata changed');
    assert(bundle.payload.settings.figmaURL===seed.settings.figmaURL,'Settings omitted');
    assert(bundle.summary.embedded===3&&bundle.summary.remote===0,'Media counts incorrect');
  });
  await test('Restore needs no network fetch and preserves image bytes and project references',async()=>{
    const fetchOriginal=window.fetch;window.fetch=()=>Promise.reject(new Error('Offline'));
    try{const offlineBundle=await ParticleBackup.parse(backup.blob);await target.restoreBackup(offlineBundle);}finally{window.fetch=fetchOriginal;}
    const data=await target.read(),image=data.assets.find(a=>a.id==='upload');
    assert(data.assets.length===3&&data.trash.length===1&&data.projects.length===1,'Record counts changed');
    assert(image.src===png&&image.notes===seed.assets[0].notes&&image.favorite&&image.project==='p','Image or metadata changed');
    assert(data.assets.find(a=>a.id==='local-svg').src.startsWith('data:image/svg+xml;base64,'),'Relative path persisted instead of portable bytes');
  });
  await test('A repeated restore is idempotent',async()=>{
    const before=JSON.stringify(await target.read()),report=await target.restoreBackup(bundle);
    assert(!report.assets&&!report.trash&&!report.projects,'Repeated import adds records');
    assert(JSON.stringify(await target.read())===before,'Repeat changed current records');
  });
  await test('Conflict copies retain both project notes and duplicate-URL bookmark notes',async()=>{
    const destination=await fresh({assets:[asset('upload',{notes:'current image note'}),asset('bookmark',{kind:'link',format:'URL',url:'https://example.com/reference',src:undefined,notes:'current bookmark note'})],projects:[{id:'p',name:'Current project',color:2,note:'keep current direction'}],settings:{figmaURL:'https://www.figma.com/design/current'}});
    const report=await destination.restoreBackup(bundle),data=await destination.read();
    assert(report.projects===1&&report.assets===3&&report.trash===1,'Expected recovered records');
    assert(data.assets.find(a=>a.id==='upload').notes==='current image note','Current image overwritten');
    const recovered=data.assets.find(a=>a.notes===seed.assets[0].notes);
    assert(recovered.id!=='upload'&&recovered.project!=='p','Conflicting IDs not remapped');
    assert(data.projects.find(p=>p.id===recovered.project).note==='原项目方向','Remapped project reference broken');
    assert(data.assets.filter(a=>a.url==='https://example.com/reference').length===2,'Bookmark notes were deduplicated away');
    assert(data.settings.figmaURL.endsWith('/current'),'Current settings overwritten');
    const again=await destination.restoreBackup(bundle);assert(!again.assets&&!again.projects&&!again.trash,'Conflict copies duplicate on retry');
  });
  await test('Same image URL without equal bytes cannot discard an embedded backup copy',async()=>{
    const destination=await fresh({assets:[seed.assets[1]],projects:seed.projects,settings:{figmaURL:''}});
    await destination.restoreBackup(bundle);
    const copies=(await destination.read()).assets.filter(a=>a.name==='local-svg');
    assert(copies.length===2&&copies.some(a=>a.src.startsWith('data:')),'URL equality hid a portable image copy');
  });
  const signed=async(payload,version=1)=>JSON.stringify({format:'particle-backup',version,exportedAt:new Date().toISOString(),payload,integrity:{algorithm:'SHA-256',digest:await ParticleBackup.digest(payload)}});
  const invalidNoWrite=async(content)=>{const before=JSON.stringify(await target.read());await rejects(ParticleBackup.parse(content).then(b=>target.restoreBackup(b)));assert(JSON.stringify(await target.read())===before,'Invalid file modified storage');};
  await test('Tampered payload fails checksum without writing',async()=>{
    const envelope=structuredClone(backup.envelope);envelope.payload.assets[0].notes='tampered';await invalidNoWrite(JSON.stringify(envelope));
  });
  await test('Truncated JSON and unsupported backup versions do not write',async()=>{
    await invalidNoWrite((await backup.blob.text()).slice(0,-10));await invalidNoWrite(await signed(bundle.payload,99));
  });
  await test('Invalid nested types, unsafe URLs and missing project references reject even with valid checksums',async()=>{
    for(const mutate of [p=>p.assets[0].tags='not an array',p=>p.assets[0].project='missing',p=>p.assets[0].src='javascript:alert(1)',p=>p.assets[0].favorite='true',p=>p.assets[0].embeddedSrc=0,p=>p.assets[0].format='<svg/onload=alert(1)>',p=>p.assets[0].coverFormat='<b>HTML</b>',p=>p.projects[0].color=90]){
      const payload=structuredClone(bundle.payload);mutate(payload);await invalidNoWrite(await signed(payload));
    }
  });
  await test('Duplicate IDs and non-decodable embedded image bytes are rejected',async()=>{
    let payload=structuredClone(bundle.payload);payload.assets.push(payload.assets[0]);await invalidNoWrite(await signed(payload));
    payload=structuredClone(bundle.payload);payload.assets[0].src='data:image/png;base64,YmFk';await invalidNoWrite(await signed(payload));
  });
  await test('Oversized input is rejected before reading it',async()=>{
    let read=false;await rejects(ParticleBackup.parse({size:ParticleBackup.MAX_FILE_BYTES+1,text:async()=>{read=true;return '';}}));assert(!read,'Oversized file was read');
  });
  await test('The storage API accepts only immutable, verified backup bundles',async()=>{
    await rejects(target.restoreBackup({payload:bundle.payload,digest:bundle.digest}),'invalid-backup');
    assert(Object.isFrozen(bundle.payload.assets[0])&&Object.isFrozen(bundle.payload.assets[0].tags),'Bundle can change after preview');
  });
  await test('A mid-transaction quota failure rolls back every recovered record',async()=>{
    const destination=await fresh(),before=JSON.stringify(await destination.read()),put=IDBObjectStore.prototype.put;let calls=0;
    IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name===destination.name&&++calls===2)throw new DOMException('Injected quota','QuotaExceededError');return put.apply(this,args);};
    try{await rejects(destination.restoreBackup(bundle));}finally{IDBObjectStore.prototype.put=put;}
    assert(JSON.stringify(await destination.read())===before,'Partial restoration committed');
    const report=await destination.restoreBackup(bundle);assert(report.assets===3,'Retry did not recover all records');
  });
  await test('Changes after preview are rechecked inside the restoring transaction',async()=>{
    const destination=await fresh({assets:[],projects:seed.projects,settings:{figmaURL:''}});
    const preview=ParticleBackup.plan(bundle,await destination.read());assert(preview.summary.copies===0,'Unexpected initial conflict');
    await destination.mutate([{kind:'add',entity:'asset',record:asset('upload',{notes:'added after preview'})}]);
    await destination.restoreBackup(bundle);
    const data=await destination.read();assert(data.assets.find(a=>a.id==='upload').notes==='added after preview','Preview race overwrote new content');
    assert(data.assets.some(a=>a.id!=='upload'&&a.name==='upload'&&a.notes===seed.assets[0].notes),'Recovery copy missing');
  });
  await test('Unavailable remote images are counted as references, never as embedded images',async()=>{
    const fetchOriginal=window.fetch;window.fetch=()=>Promise.reject(new TypeError('CORS denied'));
    let result;try{result=await ParticleBackup.create({assets:[asset('remote',{src:'https://example.com/image.png'})],trash:[],projects:seed.projects,settings:{figmaURL:''}});}finally{window.fetch=fetchOriginal;}
    assert(result.summary.remote===1&&result.summary.embedded===0,'Failed fetch misreported as embedded');
    assert(result.envelope.payload.assets[0].src==='https://example.com/image.png','Remote reference lost');
  });
  await test('Unavailable local files abort export instead of creating an incomplete backup',async()=>{
    const fetchOriginal=window.fetch;window.fetch=()=>Promise.reject(new Error('Offline'));
    try{await rejects(ParticleBackup.create({assets:[seed.assets[1]],trash:[],projects:seed.projects,settings:{figmaURL:''}}));}finally{window.fetch=fetchOriginal;}
  });
  await test('Soft deletion survives closing and reopening the database',async()=>{
    await target.mutate([{kind:'trash',entity:'asset',id:'upload',at:3000}]);
    const reopened=new ParticleStore(target.name);await reopened.open(()=>{throw new Error('Unexpected reseed');});
    const data=await reopened.read();reopened.close();assert(!data.assets.some(a=>a.id==='upload')&&data.trash.some(a=>a.id==='upload'&&a.deletedAt===3000),'Soft delete was not persistent');
  });
  await test('Stale edits and pending add retries cannot bypass the recycle bin',async()=>{
    await rejects(target.mutate([{kind:'patch',entity:'asset',id:'upload',changes:{notes:'zombie'}}]),'missing');
    await rejects(target.mutate([{kind:'add',entity:'asset',record:seed.assets[0]}]),'missing');
    assert(!(await target.read()).assets.some(a=>a.id==='upload'),'Trashed item resurrected');
  });
  await test('Restoring from trash keeps the same ID, original image, notes, tags and favorite',async()=>{
    const trashed=(await target.read()).trash.find(a=>a.id==='upload');
    await target.mutate([{kind:'restore-trash',entity:'trash',id:'upload',revision:trashed._revision}]);
    const data=await target.read(),restored=data.assets.find(a=>a.id==='upload');
    assert(!data.trash.some(a=>a.id==='upload')&&restored.src===png&&restored.notes===seed.assets[0].notes&&restored.favorite&&restored.tags.includes('中文')&&restored.project==='p','Restored metadata changed');
    assert(!restored.deletedAt,'Restored item still marked deleted');
  });
  await test('Concurrent trash restores yield one live record, never a duplicate',async()=>{
    await target.mutate([{kind:'trash',entity:'asset',id:'upload',at:4000}]);
    const outcomes=await Promise.allSettled([target.mutate([{kind:'restore-trash',entity:'trash',id:'upload'}]),target.mutate([{kind:'restore-trash',entity:'trash',id:'upload'}])]);
    assert(outcomes.filter(o=>o.status==='fulfilled').length===1,'Both restorations succeeded');
    assert((await target.read()).assets.filter(a=>a.id==='upload').length===1,'Restore duplicated content');
  });
  await test('Permanent deletion checks revision and removes the internal migration copy',async()=>{
    await target.mutate([{kind:'trash',entity:'asset',id:'upload',at:5000}]);const stale=(await target.read()).trash.find(a=>a.id==='upload');
    await target.mutate([{kind:'patch',entity:'trash',id:'upload',changes:{notes:'newer trash record'}}]);
    await rejects(target.mutate([{kind:'delete',entity:'trash',id:'upload',revision:stale._revision}]),'conflict');
    await new Promise((resolve,reject)=>{const tx=target.db.transaction('workspace','readwrite');tx.objectStore('workspace').put({version:1,...seed},'main');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    await target.mutate([{kind:'delete',entity:'trash',id:'upload'}]);
    assert(!(await target.get('main')).assets.some(a=>a.id==='upload'),'Migration copy retained deleted image');
    const data=await target.read();assert(!data.assets.some(a=>a.id==='upload')&&!data.trash.some(a=>a.id==='upload'),'Deleted record remains');
    assert((await target.get('deleted:upload')).id==='upload','Deletion marker missing');
  });
  await test('Stale edits, add retries and trash restore cannot resurrect a permanently deleted ID',async()=>{
    await rejects(target.mutate([{kind:'patch',entity:'asset',id:'upload',changes:{notes:'zombie'}}]),'missing');
    await rejects(target.mutate([{kind:'add',entity:'asset',record:seed.assets[0]}]),'missing');
    await rejects(target.mutate([{kind:'restore-trash',entity:'trash',id:'upload'}]),'missing');
  });
  await test('Explicit backup restoration after permanent deletion creates a new recovered ID',async()=>{
    await target.restoreBackup(bundle);const data=await target.read();
    assert(!data.assets.some(a=>a.id==='upload'),'Permanently deleted ID was resurrected');
    assert(data.assets.some(a=>a.name==='upload'&&a.notes===seed.assets[0].notes),'Explicit recovery copy missing');
  });
  await test('SVG is decoded only as an image; embedded script cannot execute',async()=>{
    const payload=structuredClone(bundle.payload),svg='<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"><script>window.__backupScriptExecuted=true</script><rect width="4" height="3" fill="black"/></svg>';
    payload.assets[0].src=`data:image/svg+xml;base64,${btoa(svg)}`;
    await ParticleBackup.parse(await signed(payload));assert(!window.__backupScriptExecuted,'SVG script executed');
  });
  if(backup){
    const link=document.createElement('a');link.id='validFixture';link.textContent='Download valid portable test fixture';link.download='particle-test-backup.json';link.href=URL.createObjectURL(backup.blob);document.getElementById('fixtures').append(link);
    const invalid=document.createElement('a');invalid.id='invalidFixture';invalid.textContent='Download corrupted test fixture';invalid.download='particle-test-corrupt.json';invalid.href=URL.createObjectURL(new Blob([(await backup.blob.text()).slice(0,-20)],{type:'application/json'}));document.getElementById('fixtures').append(invalid);
  }
  for(const store of stores){const name=store.name;store.close();await new Promise(resolve=>{const request=indexedDB.deleteDatabase(name);request.onsuccess=resolve;request.onerror=resolve;});}
  window.__testResults={passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
  output.textContent+=`\n\n${window.__testResults.passed} PASS / ${window.__testResults.failed} FAIL`;output.dataset.done='true';document.title=`${window.__testResults.failed?'FAIL':'PASS'} — Particle backup regression`;
})().catch(error=>{document.getElementById('results').textContent=error.stack;window.__testResults={failed:1,error:error.message};document.getElementById('results').dataset.done='true';});
