import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const dependency = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// 以替身控制網路回應順序，不連線到正式 Firebase 或寫入家庭資料。
function createHarness() {
  const states = [];
  const effects = [];
  const storage = new Map();
  const authListeners = [];
  const listeners = [];
  const messages = [];
  const auth = { currentUser: null };
  let cursor = 0;
  let settings = {};
  let writeError = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(value) {
      const index = cursor++;
      if (!(index in states)) states[index] = { current: value };
      return states[index];
    },
    useCallback(fn) { cursor++; return fn; },
    useEffect(fn) {
      const index = cursor++;
      if (!(index in states)) { states[index] = true; effects.push(fn); }
    },
  };
  const firestore = {
    collection: (_db, name) => name,
    query: collection => collection,
    orderBy: () => ({}),
    doc: (_db, collection, name) => collection + '/' + name,
    onSnapshot(target, _options, next, error) {
      const listener = { target, next, error, stopped: false };
      listeners.push(listener);
      return () => { listener.stopped = true; };
    },
    arrayUnion: (...values) => ({ operation: 'union', values }),
    arrayRemove: (...values) => ({ operation: 'remove', values }),
    async setDoc(_ref, data) {
      if (writeError) throw new Error('拒絕寫入');
      const transform = data.customCategories;
      const previous = settings.customCategories ?? [];
      settings = { ...settings, customCategories: transform.operation === 'union'
        ? [...new Set([...previous, ...transform.values])]
        : previous.filter(value => !transform.values.includes(value)) };
      for (const listener of listeners.filter(item => !item.stopped)) listener.next({ metadata: { fromCache: false, hasPendingWrites: false }, data: () => settings });
    },
  };
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(testDirectory, '..', file);
    if (cache.has(absolute)) return cache.get(absolute);
    const compiled = { exports: {} };
    cache.set(absolute, compiled.exports);
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, {
      module: compiled, exports: compiled.exports,
      require(name) {
        if (name === 'react') return react;
        if (name === 'firebase/firestore') return firestore;
        if (name === 'firebase/auth') return { onAuthStateChanged(_auth, callback) {
          const listener = { callback, stopped: false }; authListeners.push(listener);
          return () => { listener.stopped = true; };
        } };
        if (name === 'react-hot-toast') return { default: { error: text => messages.push(text), success: text => messages.push(text) } };
        if (name === '@/lib/firebase') return { auth, db: {} };
        if (name.startsWith('@/')) {
          const target = 'src/' + name.slice(2);
          return load(fs.existsSync(path.resolve(testDirectory, '..', target + '.ts')) ? target + '.ts' : target + '/index.ts');
        }
        return dependency(name);
      },
      window: {}, console: { error() {} },
      localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    }, { filename: absolute });
    return compiled.exports;
  }
  return {
    load, storage, listeners, messages, auth,
    render(fn) { cursor = 0; return fn(); },
    mount() { return effects.map(effect => effect()); },
    login(uid) { auth.currentUser = uid ? { uid } : null; authListeners.filter(item => !item.stopped).forEach(item => item.callback(auth.currentUser)); },
    rejectWrites() { writeError = true; },
    settings() { return settings; },
  };
}

const options = { collectionName: 'schedules', cachePrefix: 'cache_', orderField: 'date', orderDirection: 'asc', deserialize: (id, data) => ({ ...data, id }) };
const snapshot = (items, metadata = {}) => ({ docs: items.map(item => ({ id: item.id, data: () => item })), metadata: { fromCache: false, hasPendingWrites: false, ...metadata } });

test('儲存失敗保留表單，重試成功才關閉', async () => {
  const h = createHarness(); let closed = 0;
  const { useFormSubmission } = h.load('src/hooks/useFormSubmission.ts');
  const form = h.render(() => useFormSubmission(() => { closed++; }));
  assert.equal(await form.submit(async () => false), false);
  assert.equal(closed, 0);
  assert.equal(await form.submit(async () => true), true);
  assert.equal(closed, 1);
});

test('提交中阻止重複送出及關閉，拋錯後解除鎖定', async () => {
  const h = createHarness(); let closed = 0; let reject;
  const { useFormSubmission } = h.load('src/hooks/useFormSubmission.ts');
  const render = () => h.render(() => useFormSubmission(() => { closed++; }));
  const form = render();
  const saving = form.submit(() => new Promise((_resolve, fail) => { reject = fail; }));
  assert.equal(render().isSubmitting, true);
  form.close();
  assert.equal(await form.submit(async () => { throw new Error('不應再次送出'); }), false);
  assert.equal(closed, 0);
  reject(new Error('連線失敗')); await saving;
  assert.equal(render().isSubmitting, false);
  form.close(); assert.equal(closed, 1);
});

test('分類等次要儲存成功後保留主表單', async () => {
  const h = createHarness(); let closed = 0;
  const { useFormSubmission } = h.load('src/hooks/useFormSubmission.ts');
  const form = h.render(() => useFormSubmission(() => { closed++; }));
  await form.submit(async () => true, false);
  assert.equal(closed, 0);
});

test('即時更新套用新增、修改、刪除並更新帳號快取', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); h.mount(); h.login('family');
  const listener = h.listeners[0];
  listener.next(snapshot([{ id: 'a', title: '新行程' }]));
  assert.equal(render().data[0].title, '新行程');
  listener.next(snapshot([{ id: 'a', title: '修改後' }]));
  assert.equal(render().data[0].title, '修改後');
  listener.next(snapshot([]));
  assert.equal(render().data.length, 0);
  assert.equal(h.storage.get('cache_family'), '[]');
});

test('不完整記憶體快照及待確認寫入不覆蓋完整快取', () => {
  const h = createHarness();
  h.storage.set('cache_family', JSON.stringify([{ id: 'saved' }]));
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); h.mount(); h.login('family');
  h.listeners[0].next(snapshot([], { fromCache: true }));
  h.listeners[0].next(snapshot([{ id: 'pending' }], { hasPendingWrites: true }));
  assert.equal(render().data[0].id, 'saved');
  assert.equal(JSON.parse(h.storage.get('cache_family'))[0].id, 'saved');
});

test('帳號切換及卸載後忽略舊監聽回應', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); const cleanup = h.mount()[0]; h.login('a');
  const old = h.listeners[0]; h.login('b');
  assert.equal(old.stopped, true);
  old.next(snapshot([{ id: 'old' }]));
  assert.equal(render().data.length, 0);
  const current = h.listeners[1]; cleanup();
  assert.equal(current.stopped, true);
  current.next(snapshot([{ id: 'late' }]));
  assert.equal(render().data.length, 0);
});

test('同步失敗保留資料，重新整理重建監聽', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); h.mount(); h.login('a');
  h.listeners[0].next(snapshot([{ id: 'saved' }]));
  h.listeners[0].error(new Error('拒絕讀取'));
  assert.equal(render().data[0].id, 'saved');
  render().refresh();
  assert.equal(h.listeners[0].stopped, true);
  assert.equal(h.listeners.length, 2);
});

test('重新整理等待伺服器回應，不被本機快照提前結束', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); h.mount(); h.login('a');
  h.listeners[0].next(snapshot([{ id: 'saved' }]));
  render().refresh();
  h.listeners[1].next(snapshot([], { fromCache: true }));
  assert.equal(render().isRefreshing, true);
  assert.equal(render().data[0].id, 'saved');
  h.listeners[1].next(snapshot([{ id: 'updated' }]));
  assert.equal(render().isRefreshing, false);
  assert.equal(render().data[0].id, 'updated');
});

test('舊儲存操作在切換帳號或卸載後不能修改資料與快取', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); const cleanup = h.mount()[0]; h.login('a');
  h.listeners[0].next(snapshot([{ id: 'a-data' }]));
  const old = render();
  h.login('b');
  h.listeners[1].next(snapshot([{ id: 'b-data' }]));
  old.setData([{ id: 'late-a' }]);
  old.updateCache([{ id: 'late-a' }]);
  old.restoreData();
  assert.equal(render().data[0].id, 'b-data');
  assert.equal(JSON.parse(h.storage.get('cache_b'))[0].id, 'b-data');
  assert.equal(JSON.parse(h.storage.get('cache_a'))[0].id, 'a-data');
  h.login(null); h.login('a');
  h.listeners.at(-1).next(snapshot([{ id: 'new-a-session' }]));
  old.setData([{ id: 'late-a' }]);
  assert.equal(render().data[0].id, 'new-a-session');
  const current = render(); cleanup();
  current.setData([{ id: 'after-unmount' }]);
  current.updateCache([{ id: 'after-unmount' }]);
  assert.equal(render().data[0].id, 'new-a-session');
  assert.equal(JSON.parse(h.storage.get('cache_a'))[0].id, 'new-a-session');
});

test('回復失敗操作時保留其他家人的最新修改', () => {
  const h = createHarness();
  const { useSharedCollection } = h.load('src/hooks/useSharedCollection.ts');
  const render = () => h.render(() => useSharedCollection(options));
  render(); h.mount(); h.login('a');
  h.listeners[0].next(snapshot([{ id: 'a' }]));
  render().setData([]);
  h.listeners[0].next(snapshot([{ id: 'a' }, { id: 'family-added' }]));
  render().restoreData();
  assert.equal(render().data[1].id, 'family-added');
});

test('自訂分類在首次 render 還原，成功移轉後不復活已刪除分類', async () => {
  const h = createHarness(); h.auth.currentUser = { uid: 'a' };
  h.storage.set('user_custom_categories', JSON.stringify(['家族聚會']));
  const { useCategories } = h.load('src/hooks/useCategories.tsx');
  const render = () => h.render(useCategories);
  assert.ok(render().categories.includes('家族聚會'));
  h.mount(); h.login('a');
  h.listeners[0].next({ metadata: { fromCache: false, hasPendingWrites: false }, data: () => ({}) });
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(h.settings().customCategories.includes('家族聚會'));
  assert.equal(h.storage.has('user_custom_categories'), false);
  await render().deleteCategory('家族聚會');
  h.login(null); h.login('a');
  h.listeners.at(-1).next({ metadata: { fromCache: false, hasPendingWrites: false }, data: h.settings });
  assert.equal(render().categories.includes('家族聚會'), false);
});

test('分類儲存失敗回傳失敗且保留原分類', async () => {
  const h = createHarness(); h.auth.currentUser = { uid: 'a' }; h.rejectWrites();
  const { useCategories } = h.load('src/hooks/useCategories.tsx');
  const categories = h.render(useCategories);
  assert.equal(await categories.addCategory('新分類'), false);
  assert.equal(h.render(useCategories).categories.includes('新分類'), false);
});

test('時間預設在首次 render 還原，空記憶體快照不清除設定', () => {
  const h = createHarness(); h.auth.currentUser = { uid: 'a' };
  h.storage.set('category_time_presets_v2_a', JSON.stringify({ 排班: { defaultStartTime: '09:00', defaultEndTime: '18:00' } }));
  const { useCategoryTimePresets } = h.load('src/hooks/useCategoryTimePresets.ts');
  const render = () => h.render(useCategoryTimePresets);
  assert.equal(render().getDefaultTime('排班').startTime, '09:00');
  h.mount(); h.login('a');
  h.listeners[0].next({ metadata: { fromCache: true, hasPendingWrites: false }, data: () => ({}) });
  assert.equal(render().getDefaultTime('排班').endTime, '18:00');
});

test('台灣凌晨、月底與年底均使用本地日期', () => {
  const previous = process.env.TZ; process.env.TZ = 'Asia/Taipei';
  try {
    const h = createHarness();
    const { getTodayDateString } = h.load('src/lib/restock.ts');
    assert.equal(getTodayDateString(new Date('2026-09-29T16:01:00Z')), '2026-09-30');
    assert.equal(getTodayDateString(new Date('2026-09-30T16:01:00Z')), '2026-10-01');
    assert.equal(getTodayDateString(new Date('2026-12-31T16:01:00Z')), '2027-01-01');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
