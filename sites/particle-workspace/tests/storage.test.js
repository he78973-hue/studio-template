(async () => {
  const output = document.getElementById('results');
  const results = [], name = `particle-regression-${crypto.randomUUID()}`;
  const A = new ParticleStore(name), B = new ParticleStore(name);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const rejectWith = async (promise, code) => {
    try { await promise; } catch (error) { assert(error.code === code, `Expected ${code}, got ${error.code || error.name}`); return; }
    throw new Error(`Expected ${code}, but write succeeded`);
  };
  const test = async (label, action) => {
    try { await action(); results.push({ label, pass:true }); }
    catch (error) { results.push({ label, pass:false, error:error.message }); }
    output.textContent = results.map(r => `${r.pass ? 'PASS' : 'FAIL'} ${r.label}${r.error ? ': ' + r.error : ''}`).join('\n');
  };
  const asset = (id, extra = {}) => ({ id, name:id, kind:'image', format:'PNG', tags:[], favorite:false, notes:'', project:'p', created:1, ...extra });
  const legacy = { version:1, assets:[asset('legacy',{notes:'keep this note',favorite:true,tags:['original']})], projects:[{id:'p',name:'Preserved project',note:'original direction',color:1}], settings:{figmaURL:'https://www.figma.com/community'} };
  const seed = () => { throw new Error('Existing legacy data must not be replaced by demo seed'); };
  const raw = await new Promise((resolve,reject) => {
    const request = indexedDB.open(name,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('workspace');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  await new Promise((resolve,reject)=>{const tx=raw.transaction('workspace','readwrite');tx.objectStore('workspace').put(legacy,'main');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  raw.close();
  await test('Failed migration retains the legacy snapshot and can be retried',async()=>{
    const original=IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction=function(stores,mode,...rest){if(mode==='readwrite')throw new DOMException('Migration quota failure','QuotaExceededError');return original.call(this,stores,mode,...rest);};
    let failed=false;
    try{await A.open(seed);}catch(error){failed=error.name==='QuotaExceededError';}finally{IDBDatabase.prototype.transaction=original;}
    assert(failed,'Expected migration failure');
    assert(JSON.stringify(await A.get('main'))===JSON.stringify(legacy),'Legacy snapshot was damaged');
    assert(!await A.get('record-schema'),'Failed migration was marked complete');
  });
  await test('Legacy migration preserves assets, notes, tags, projects and Figma settings',async()=>{
    const data=await A.open(seed);
    assert(data.assets.length===1&&data.assets[0].notes==='keep this note'&&data.assets[0].favorite,'Legacy asset changed');
    assert(data.assets[0].tags[0]==='original'&&data.projects[0].note==='original direction','Legacy metadata changed');
    assert(data.settings.figmaURL===legacy.settings.figmaURL,'Figma destination changed');
    assert(JSON.stringify(await A.get('main'))===JSON.stringify(legacy),'Migration backup changed');
  });
  await test('Second client initializes without reseeding migrated records',async()=>{
    await A.mutate([{kind:'add',entity:'asset',record:asset('before-b')}]);
    const data=await B.open(seed);assert(data.assets.some(a=>a.id==='before-b'),'Second client lost a record');
  });
  await test('A stale client can favorite without overwriting another client’s newly added asset',async()=>{
    await B.read();
    await A.mutate([{kind:'add',entity:'asset',record:asset('new-in-a')}]);
    await B.mutate([{kind:'favorite',entity:'asset',id:'legacy'}]);
    const data=await A.read();assert(data.assets.some(a=>a.id==='new-in-a'),'New asset overwritten');
    assert(data.assets.find(a=>a.id==='legacy').favorite===false,'Favorite did not change');
  });
  await test('Concurrent edits to distinct fields merge without overwriting',async()=>{
    await Promise.all([
      A.mutate([{kind:'patch',entity:'asset',id:'legacy',changes:{name:'renamed'},expected:{name:'legacy'}}]),
      B.mutate([{kind:'patch',entity:'asset',id:'legacy',changes:{notes:'new note'},expected:{notes:'keep this note'}}])
    ]);
    const saved=(await A.read()).assets.find(a=>a.id==='legacy');assert(saved.name==='renamed'&&saved.notes==='new note','A field was overwritten');
  });
  await test('Concurrent tag additions preserve both tags',async()=>{
    await Promise.all([A.mutate([{kind:'tag',entity:'asset',id:'legacy',tag:'A'}]),B.mutate([{kind:'tag',entity:'asset',id:'legacy',tag:'B'}])]);
    const tags=(await A.read()).assets.find(a=>a.id==='legacy').tags;assert(tags.includes('A')&&tags.includes('B')&&tags.includes('original'),'Tags lost');
  });
  await test('Same-field conflicts reject a stale edit rather than silently overwrite',async()=>{
    await A.mutate([{kind:'patch',entity:'asset',id:'legacy',changes:{notes:'winner'},expected:{notes:'new note'}}]);
    await rejectWith(B.mutate([{kind:'patch',entity:'asset',id:'legacy',changes:{notes:'stale'},expected:{notes:'new note'}}]),'conflict');
    assert((await B.read()).assets.find(a=>a.id==='legacy').notes==='winner','Conflict overwrote content');
  });
  await test('Deleting an asset cannot be undone by a stale patch',async()=>{
    await A.mutate([{kind:'delete',entity:'asset',id:'new-in-a'}]);
    await rejectWith(B.mutate([{kind:'patch',entity:'asset',id:'new-in-a',changes:{name:'zombie'}}]),'missing');
    assert(!(await A.read()).assets.some(a=>a.id==='new-in-a'),'Deleted asset resurrected');
  });
  await test('A failing batch rolls back all preceding mutations',async()=>{
    await rejectWith(A.mutate([{kind:'add',entity:'asset',record:asset('must-rollback')},{kind:'patch',entity:'asset',id:'not-found',changes:{notes:'x'}}]),'missing');
    assert(!(await A.read()).assets.some(a=>a.id==='must-rollback'),'Partial batch committed');
  });
  await test('Injected write failure leaves data untouched; retry with stable ID creates exactly once',async()=>{
    const original=A.db.transaction.bind(A.db),record=asset('retry-once');
    A.db.transaction=(stores,mode,...rest)=>{if(mode==='readwrite')throw new DOMException('Injected failure','QuotaExceededError');return original(stores,mode,...rest);};
    let failed=false;try{await A.mutate([{kind:'add',entity:'asset',record}]);}catch(error){failed=error.name==='QuotaExceededError';}finally{delete A.db.transaction;}
    assert(failed,'Injected error not surfaced');assert(!(await A.read()).assets.some(a=>a.id==='retry-once'),'Failed save mutated storage');
    await A.mutate([{kind:'add',entity:'asset',record}]);await A.mutate([{kind:'add',entity:'asset',record}]);
    assert((await A.read()).assets.filter(a=>a.id==='retry-once').length===1,'Retry duplicated the asset');
  });
  await test('Two clients cannot concurrently create duplicate bookmark URLs',async()=>{
    const outcomes=await Promise.allSettled([A.mutate([{kind:'add',entity:'asset',record:asset('url-a',{kind:'link',url:'https://example.com/shared'})}]),B.mutate([{kind:'add',entity:'asset',record:asset('url-b',{kind:'link',url:'https://example.com/shared'})}])]);
    assert(outcomes.filter(r=>r.status==='fulfilled').length===1,'Expected one successful bookmark');
    assert(outcomes.some(r=>r.status==='rejected'&&r.reason.code==='duplicate'),'Duplicate error missing');
  });
  await test('Project recency uses a monotonic timestamp and settings persist separately',async()=>{
    await A.mutate([{kind:'touch',entity:'project',id:'p',field:'lastOpenedAt',at:1000},{kind:'patch',entity:'settings',changes:{figmaURL:'https://www.figma.com/files'}}]);
    await B.mutate([{kind:'touch',entity:'project',id:'p',field:'lastOpenedAt',at:500}]);
    const data=await B.read();assert(data.projects[0].lastOpenedAt===1000&&data.settings.figmaURL.endsWith('/files'),'Independent metadata lost');
  });
  await test('A successful transaction notifies the other client',async()=>{
    let timer,unsubscribe;
    const received=new Promise((resolve,reject)=>{unsubscribe=B.subscribe(()=>{clearTimeout(timer);resolve();});timer=setTimeout(()=>reject(new Error('No cross-client notification')),2000);});
    await A.mutate([{kind:'tag',entity:'asset',id:'legacy',tag:'notified'}]);await received;unsubscribe();
  });
  A.close();B.close();
  await new Promise(resolve=>{const request=indexedDB.deleteDatabase(name);request.onsuccess=resolve;request.onerror=resolve;});
  window.__testResults={passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
  output.textContent += `\n\n${window.__testResults.passed} PASS / ${window.__testResults.failed} FAIL`;
  document.title=`${window.__testResults.failed?'FAIL':'PASS'} — Particle storage regression`;
  output.dataset.done='true';
})().catch(error=>{document.getElementById('results').textContent=error.stack;window.__testResults={failed:1,error:error.message};document.getElementById('results').dataset.done='true';});
