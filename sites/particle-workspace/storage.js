/* Per-record persistence. The v0.1 snapshot remains available as a migration backup. */
(() => {
  'use strict';
  const copy = value => structuredClone(value);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const keyFor = (entity, id) => entity === 'settings' ? 'settings' : `${entity}:${id}`;
  const issue = (code, message) => Object.assign(new Error(message), { code });

  class ParticleStore {
    constructor(name = 'particle-library') {
      this.name = name;
      this.db = null;
      this.listeners = new Set();
      this.channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(`${name}:records`) : null;
      if (this.channel) this.channel.onmessage = () => this.listeners.forEach(listener => listener());
    }

    async open(seed) {
      if (!this.db) {
        this.db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(this.name, 1);
          request.onupgradeneeded = () => request.result.createObjectStore('workspace');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
          request.onblocked = () => reject(issue('blocked', '请关闭旧版素材库页面后重试。'));
        });
        this.db.onversionchange = () => { this.db.close(); this.db = null; };
      }
      const marker = await this.get('record-schema');
      if (!marker) {
        const legacy = await this.get('main');
        const initial = legacy?.version === 1 ? legacy : await seed();
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction('workspace', 'readwrite');
          const store = tx.objectStore('workspace');
          const check = store.get('record-schema');
          check.onsuccess = () => {
            // A second tab may have finished migration while this tab prepared its seed.
            if (check.result) return;
            for (const asset of initial.assets || []) store.put({ ...copy(asset), _revision: 1 }, keyFor('asset', asset.id));
            for (const [index, project] of (initial.projects || []).entries()) {
              store.put({ order: index, created: Date.now() - index, updatedAt: 0, lastOpenedAt: 0, ...copy(project), _revision: 1 }, keyFor('project', project.id));
            }
            store.put({ figmaURL: '', ...copy(initial.settings || {}), _revision: 1 }, 'settings');
            store.put({ version: 2, migratedAt: Date.now() }, 'record-schema');
          };
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error || issue('aborted', '初始化未完成，请重试。'));
        });
      }
      return this.read();
    }

    get(key) {
      return new Promise((resolve, reject) => {
        const request = this.db.transaction('workspace', 'readonly').objectStore('workspace').get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    read() {
      return new Promise((resolve, reject) => {
        if (!this.db) { reject(issue('closed', '本地存储尚未连接，请重试。')); return; }
        const tx = this.db.transaction('workspace', 'readonly'), store = tx.objectStore('workspace');
        const assets = store.getAll(IDBKeyRange.bound('asset:', 'asset:\uffff'));
        const projects = store.getAll(IDBKeyRange.bound('project:', 'project:\uffff'));
        const trash = store.getAll(IDBKeyRange.bound('trash:', 'trash:\uffff'));
        const deleted = store.getAll(IDBKeyRange.bound('deleted:', 'deleted:\uffff'));
        const settings = store.get('settings');
        tx.oncomplete = () => resolve({ version: 2,
          assets: assets.result.sort((a, b) => b.created - a.created),
          trash: trash.result.sort((a, b) => b.deletedAt - a.deletedAt),
          deletedIDs: deleted.result.map(record=>record.id),
          projects: projects.result.sort((a, b) => ((a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)) || b.created - a.created),
          settings: settings.result || { figmaURL: '' }
        });
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }

    mutate(operations) {
      const changes = copy(operations);
      return new Promise((resolve, reject) => {
        if (!this.db) { reject(issue('closed', '本地存储尚未连接，请重试。')); return; }
        let tx, failure = null;
        const results = [];
        try { tx = this.db.transaction('workspace', 'readwrite'); } catch (error) { reject(error); return; }
        const store = tx.objectStore('workspace');
        const fail = error => { failure = error; tx.abort(); };
        const next = index => {
          if (index >= changes.length) return;
          const op = changes[index], key = keyFor(op.entity, op.id || op.record?.id);
          const request = store.get(key);
          request.onsuccess = () => {
            try {
              const current = request.result;
              if (op.kind === 'add') {
                if (current) {
                  // Stable IDs make retries idempotent, without replacing an existing record.
                  const expected = { ...op.record }; delete expected._revision;
                  const actual = { ...current }; delete actual._revision;
                  if (!equal(expected, actual)) throw issue('conflict', '这份素材已存在且内容发生变化，请重新打开后核对。');
                  results.push(current); next(index + 1); return;
                }
                if (op.entity === 'asset') {
                  const trashed=store.get(keyFor('trash',op.record.id));
                  const deleted=store.get(keyFor('deleted',op.record.id));
                  deleted.onsuccess=()=>{
                    if(trashed.result||deleted.result){fail(issue('missing','这份素材已被移除。请从回收站恢复，或重新导入为新素材。'));return;}
                    const add=()=>{const record={...op.record,_revision:1};store.put(record,key);results.push(record);next(index+1);};
                    if(op.record.kind!=='link'){add();return;}
                    const all=store.getAll(IDBKeyRange.bound('asset:','asset:\uffff'));
                    all.onsuccess=()=>{
                      if(all.result.some(a=>a.kind==='link'&&a.url===op.record.url)){fail(issue('duplicate','这个网页已在另一个窗口收集，请搜索原链接。'));return;}
                      add();
                    };
                  };
                  return;
                }
                const record = { ...op.record, _revision: 1 };
                store.put(record, key); results.push(record); next(index + 1); return;
              }
              if (!current) {
                if (op.kind === 'delete' || op.kind === 'touch') { next(index + 1); return; }
                throw issue('missing', '这份内容已在另一个窗口移除，请返回素材库查看。');
              }
              if (op.kind === 'trash') {
                if(op.entity!=='asset')throw issue('invalid-operation','只能把素材移入回收站。');
                if(op.revision&&op.revision!==current._revision)throw issue('conflict','素材已在另一个窗口更新，请重新打开后再移入回收站。');
                const record={...current,deletedAt:op.at||Date.now(),_revision:(current._revision||0)+1};
                store.put(record,keyFor('trash',current.id));store.delete(key);results.push(record);next(index+1);return;
              }
              if (op.kind === 'restore-trash') {
                if(op.entity!=='trash')throw issue('invalid-operation','只能从回收站恢复素材。');
                if(op.revision&&op.revision!==current._revision)throw issue('conflict','回收站记录已变化，请重新打开后再恢复。');
                const active=store.get(keyFor('asset',current.id));
                active.onsuccess=()=>{
                  if(active.result){fail(issue('conflict','素材库中已有同 ID 的记录，请先核对。'));return;}
                  const record={...current,_revision:(current._revision||0)+1};delete record.deletedAt;
                  store.put(record,keyFor('asset',current.id));store.delete(key);results.push(record);next(index+1);
                };
                return;
              }
              if (op.kind === 'delete') {
                if (op.revision && op.revision !== current._revision) throw issue('conflict', '素材已在另一个窗口更新，请重新打开后再移除。');
                if(op.entity==='asset'||op.entity==='trash')store.put({id:current.id,at:Date.now()},keyFor('deleted',current.id));
                store.delete(key); results.push(current);
                if(op.entity==='asset'||op.entity==='trash'){
                  const legacy=store.get('main');
                  legacy.onsuccess=()=>{
                    // Explicit deletion also removes that item from the internal
                    // migration snapshot; already downloaded backups are separate.
                    if(legacy.result?.assets?.some(a=>a.id===current.id))store.put({...legacy.result,assets:legacy.result.assets.filter(a=>a.id!==current.id)},'main');
                    next(index+1);
                  };
                }else next(index+1);
                return;
              }
              let record = { ...current };
              if (op.kind === 'patch') {
                for (const [field, expected] of Object.entries(op.expected || {})) {
                  if (!equal(current[field], expected) && !equal(current[field], op.changes[field])) {
                    throw issue('conflict', '这个字段已在另一个窗口修改。你的输入已保留，请核对最新内容后再保存。');
                  }
                }
                Object.assign(record, op.changes);
              } else if (op.kind === 'favorite') record.favorite = !current.favorite;
              else if (op.kind === 'tag') {
                const tags = new Set(current.tags || []);
                if (op.remove) tags.delete(op.tag); else tags.add(op.tag);
                record.tags = [...tags];
              } else if (op.kind === 'touch') {
                record[op.field] = Math.max(current[op.field] || 0, op.at);
              } else throw issue('invalid-operation', '无法识别这次保存操作。');
              record._revision = (current._revision || 0) + 1;
              store.put(record, key); results.push(record); next(index + 1);
            } catch (error) { fail(error); }
          };
        };
        tx.oncomplete = () => {
          this.channel?.postMessage({ updated: Date.now() });
          resolve(results);
        };
        tx.onerror = () => reject(failure || tx.error);
        tx.onabort = () => reject(failure || tx.error || issue('aborted', '保存被中断，请重试。'));
        next(0);
      });
    }

    restoreBackup(bundle) {
      return new Promise((resolve,reject)=>{
        if(!globalThis.ParticleBackup?.isVerified(bundle)){reject(issue('invalid-backup','请先选择并校验备份文件。'));return;}
        if(!this.db){reject(issue('closed','本地素材库尚未连接。'));return;}
        let tx,report,failure;
        try{tx=this.db.transaction('workspace','readwrite');}catch(error){reject(error);return;}
        const store=tx.objectStore('workspace');
        const assets=store.getAll(IDBKeyRange.bound('asset:','asset:\uffff'));
        const trash=store.getAll(IDBKeyRange.bound('trash:','trash:\uffff'));
        const projects=store.getAll(IDBKeyRange.bound('project:','project:\uffff'));
        const deleted=store.getAll(IDBKeyRange.bound('deleted:','deleted:\uffff'));
        const settings=store.get('settings');
        settings.onsuccess=()=>{
          try{
            // Planning and writes share one transaction, including concurrent-tab checks.
            const current={assets:assets.result,trash:trash.result,projects:projects.result,deletedIDs:deleted.result.map(r=>r.id),settings:settings.result||{figmaURL:''}};
            const plan=ParticleBackup.plan(bundle,current);report=plan.summary;
            for(const entry of plan.writes){const record={...entry.record,_revision:(entry.record._revision||0)+1};store.put(record,keyFor(entry.entity,record.id));}
          }catch(error){failure=error;tx.abort();}
        };
        tx.oncomplete=()=>{this.channel?.postMessage({updated:Date.now()});resolve(report);};
        tx.onerror=()=>reject(failure||tx.error);
        tx.onabort=()=>reject(failure||tx.error||issue('aborted','恢复未完成，原有数据未改动。'));
      });
    }

    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    close() { this.db?.close(); this.db = null; this.channel?.close(); }
  }
  window.ParticleStore = ParticleStore;
})();
