import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const members = ['Sandy', 'Brian', 'Mango', '孔呆', '共同'];
const source = ts.transpileModule(fs.readFileSync(new URL('../src/lib/purchases.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: () => ({ FAMILY_MEMBERS: members }), Date, Map });
const { isPurchaseInput, deserializePurchase, countPurchases, sumPurchasePrices, formatPurchasePrice } = loadedModule.exports;
const phone = { name: '家庭手機', category: '手機', beneficiary: 'Brian', purchaser: 'Sandy', date: '2026-10-07', platform: '門市', price: 12900, priceCny: null, note: '', memory: '12GB', storage: '512GB' };

test('手機規格、成員、日期與必填欄位均須有效', () => {
  assert.equal(isPurchaseInput(phone), true);
  for (const fields of [{ price: -1 }, { price: NaN }, { price: null }, { price: Infinity }, { priceCny: -1 }, { memory: ' ' }, { storage: '' }, { memory: 32 }, { beneficiary: '未知' }, { date: '2026-02-30' }, { name: ' ' }, { platform: '' }]) {
    assert.equal(isPurchaseInput({ ...phone, ...fields }), false);
  }
  assert.equal(isPurchaseInput({ ...phone, category: '攝影器材', memory: null, storage: null }), true);
});

test('Firestore 欄位缺少或型別錯誤時不破壞畫面', () => {
  const item = deserializePurchase('one', { ...phone, beneficiary: 42, memory: 32, note: null });
  assert.equal(item.id, 'one');
  assert.equal(item.beneficiary, '共同');
  assert.equal(item.memory, null);
  assert.equal(item.note, '');
});

test('自訂平台與規格可儲存並完整還原', () => {
  const custom = { ...phone, platform: '品牌門市', memory: '24GB', storage: '2TB' };
  assert.equal(isPurchaseInput(custom), true);
  const restored = deserializePurchase('custom', custom);
  assert.equal(restored.platform, '品牌門市');
  assert.equal(restored.memory, '24GB');
  assert.equal(restored.storage, '2TB');
  assert.equal(isPurchaseInput({ ...custom, memory: 'x'.repeat(31) }), false);
});

test('分類與使用對象統計來自實際紀錄且支援自訂分類', () => {
  const items = [deserializePurchase('one', phone), deserializePurchase('two', { ...phone, purchaser: 'Brian' }), deserializePurchase('three', { ...phone, category: '攝影器材', beneficiary: '共同' })];
  assert.equal(JSON.stringify(countPurchases(items, 'category')), JSON.stringify([{ name: '手機', count: 2 }, { name: '攝影器材', count: 1 }]));
  assert.equal(JSON.stringify(countPurchases(items, 'beneficiary')), JSON.stringify([{ name: 'Brian', count: 2 }, { name: '共同', count: 1 }]));
  assert.equal(countPurchases([], 'category').length, 0);
});

test('舊紀錄沒有價格時保留空值，價格可完整還原', () => {
  const { price, ...legacy } = phone;
  assert.equal(deserializePurchase('legacy', legacy).price, null);
  assert.equal(deserializePurchase('priced', phone).price, price);
  assert.equal(deserializePurchase('invalid', { ...phone, price: -1 }).price, null);
  assert.equal(isPurchaseInput({ ...phone, price: 0 }), true);
});

test('雙幣別各自驗證、保留與統計，不相加成一個金額', () => {
  const dual = { ...phone, price: 6989, priceCny: 1687, memory: null, storage: null };
  assert.equal(isPurchaseInput(dual), true);
  assert.equal(isPurchaseInput({ ...dual, price: null }), true);
  assert.equal(isPurchaseInput({ ...dual, price: null, priceCny: null }), false);
  const restored = deserializePurchase('dual', dual);
  assert.equal(restored.priceCny, 1687);
  const totals = sumPurchasePrices([restored, deserializePurchase('twd', phone)]);
  assert.equal(totals.twd, 19889);
  assert.equal(totals.cny, 1687);
  assert.ok(formatPurchasePrice(1687, 'CNY').includes('人民幣'));
  assert.equal(deserializePurchase('legacy', { price: 100 }).priceCny, null);
});
