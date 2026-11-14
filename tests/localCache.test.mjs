import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// 模擬有容量上限的 localStorage，驗證空間不足時只清舊版鍵、不動目前使用中的快取
function createStorage(limit, initial) {
  const store = new Map(Object.entries(initial));
  const used = () => [...store].reduce((sum, [key, value]) => sum + key.length + value.length, 0);
  return {
    store,
    get length() { return store.size; },
    key: index => [...store.keys()][index] ?? null,
    getItem: key => store.get(key) ?? null,
    removeItem: key => { store.delete(key); },
    setItem(key, value) {
      const previous = store.get(key);
      const next = used() - (previous ? key.length + previous.length : 0) + key.length + value.length;
      if (next > limit) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
      store.set(key, value);
    },
  };
}

function load(localStorage, warnings) {
  const loaded = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(new URL('../src/lib/localCache.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { module: loaded, exports: loaded.exports, localStorage, JSON, console: { warn: (...args) => warnings.push(args) } });
  return loaded.exports;
}

test('空間不足時清除舊版快取後重試成功', () => {
  const storage = createStorage(200, {
    'family-dates': 'x'.repeat(80),
    schedule_cache_uid1: 'x'.repeat(60),
    schedule_cache_v2_uid1: '[]',
    expense_cache_v1_uid1: '[1]',
  });
  const warnings = [];
  const { writeLocalCache } = load(storage, warnings);

  assert.equal(writeLocalCache('schedule_cache_v2_uid1', ['a'.repeat(100)]), true);
  assert.equal(storage.getItem('family-dates'), null);
  assert.equal(storage.getItem('schedule_cache_uid1'), null);
  assert.equal(storage.getItem('expense_cache_v1_uid1'), '[1]');
  assert.equal(warnings.length, 0);
});

test('沒有舊鍵可清時只警告一次，不拋出錯誤', () => {
  const storage = createStorage(40, { expense_cache_v1_uid1: '[1]' });
  const warnings = [];
  const { writeLocalCache } = load(storage, warnings);

  assert.equal(writeLocalCache('schedule_cache_v2_uid1', ['a'.repeat(100)]), false);
  assert.equal(writeLocalCache('schedule_cache_v2_uid1', ['a'.repeat(100)]), false);
  assert.equal(warnings.length, 1);
  assert.equal(storage.getItem('expense_cache_v1_uid1'), '[1]');
});
