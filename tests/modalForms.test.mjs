import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// 執行真正的表單事件處理器，避免只比對樣式字串卻漏掉資料被改寫。
function createForm(path, props, extraModules = {}) {
  const slots = [];
  let cursor = 0;
  const react = {
    useId: () => 'test-field',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo: calculate => calculate(),
  };
  const modules = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' },
    '@/types': { EXPENSE_CATEGORIES: ['餐費'], INCOME_CATEGORIES: ['薪水', '獎金'], FAMILY_MEMBERS: ['共同'], MEMBER_COLORS: { 共同: '#c084fc' } },
    '@/lib/date': { getTodayDateString: () => '2026-10-23' },
    '@/hooks/useFormSubmission': { useFormSubmission: onClose => ({ isSubmitting: false, close: onClose, submit: save => save() }) },
    '@/components/Modal': { __esModule: true, default: 'Modal', ModalActions: 'ModalActions' },
    '@/components/SaveButton': { __esModule: true, default: 'SaveButton' },
    '@/components/PurchaseManager/PurchaseChoiceField': { __esModule: true, default: 'PurchaseChoiceField' },
    '@/lib/purchases': { PHONE_MEMORY: ['8GB'], PHONE_STORAGE: ['256GB'], PURCHASE_PLATFORMS: ['門市'] },
    'lucide-react': {},
    'clsx': { __esModule: true, default: (...values) => values.filter(Boolean).join(' ') },
    'react-hot-toast': { __esModule: true, default: { error() {} } },
    html2canvas: { __esModule: true, default() {} },
    jspdf: { __esModule: true, default() {} },
    ...extraModules,
  };
  const loaded = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { module: loaded, exports: loaded.exports, crypto, Number, Date,
    require(name) { if (name in modules) return modules[name]; throw new Error(`Unexpected import: ${name}`); } });
  return () => { cursor = 0; return loaded.exports.default(props); };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (Array.isArray(tree)) return tree.map(value => find(value, predicate)).find(Boolean);
  if (predicate(tree)) return tree;
  return find(tree.props?.children, predicate);
}

test('收入表單提交使用者選擇的分類', async () => {
  let saved;
  const render = createForm('../src/components/ExpenseManager/AddExpenseModal.tsx', {
    isOpen: true, onClose() {}, onSubmit: async value => { saved = value; return true; },
    initialData: { id: 'income', type: 'income', amount: 100, category: '薪水', member: '共同', date: '2026-10-23' },
  });
  await render().props.onSubmit({ preventDefault() {} });
  assert.equal(saved.category, '薪水');
  assert.equal(saved.type, 'income');
});

test('極小食材反推保留正份數及烹飪設定，另存後不會除以零', async () => {
  let saved;
  const recipe = { id: 'recipe', title: '麵包', baseServings: 1, ingredients: [{ id: 'flour', name: '麵粉', amount: 1000, unit: 'g' }], cookingTime: { value: 180, unit: '度', minutes: 30 } };
  const render = createForm('../src/components/RecipeManager/RecipeCalculator.tsx', { recipe, onClose() {}, onDelete() {}, onEdit() {}, onAdd: async value => { saved = value; return true; } });
  find(render(), node => node.type === 'button' && node.props.children === '依食材反推').props.onClick();
  find(render(), node => node.type === 'input' && node.props.placeholder === '例如：150').props.onChange({ target: { value: '1' } });
  const modal = find(render(), node => node.type === 'Modal');
  await find(modal.props.footer, node => node.type === 'SaveButton').props.onClick();
  assert.equal(saved.baseServings, 0.001);
  assert.equal(saved.ingredients[0].amount, 1);
  assert.equal(saved.cookingTime.minutes, 30);
  assert.ok(Number.isFinite(1 / saved.baseServings));
});

test('子分類名稱的 Enter 不會送出整份行程', async () => {
  let mainSaves = 0;
  let subSaves = 0;
  const render = createForm('../src/components/DateManager/AddDateModal.tsx', { isOpen: true, onClose() {}, onSubmit: async () => { mainSaves++; return true; } }, {
    '@/hooks/useCategories': { useCategories: () => ({ categories: ['其它'], isDefaultCategory: () => true }) },
    '@/hooks/useCategoryTimePresets': { useCategoryTimePresets: () => ({ getDefaultTime: () => ({}), getSubCategories: () => [], saveSubCategory: async () => { subSaves++; return true; } }) },
  });
  find(render(), node => node.type === 'button' && node.props.title === '設定此分類的子分類時間').props.onClick();
  find(render(), node => node.props['aria-label'] === '子分類名稱').props.onChange({ target: { value: '週六班' } });
  find(render(), node => node.props['aria-label'] === '子分類開始時間').props.onChange({ target: { value: '09:00' } });
  let prevented = false;
  find(render(), node => node.props['aria-label'] === '子分類名稱').props.onKeyDown({ key: 'Enter', nativeEvent: { isComposing: false }, preventDefault() { prevented = true; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(prevented, true);
  assert.equal(mainSaves, 0);
  assert.equal(subSaves, 1);
});

test('反推重量失效後不會另存上一組結果', async () => {
  let saves = 0;
  const recipe = { id: 'recipe', title: '麵包', baseServings: 1, ingredients: [{ id: 'flour', name: '麵粉', amount: 1000, unit: 'g' }] };
  const render = createForm('../src/components/RecipeManager/RecipeCalculator.tsx', { recipe, onClose() {}, onDelete() {}, onEdit() {}, onAdd: async () => { saves++; return true; } });
  find(render(), node => node.type === 'button' && node.props.children === '依食材反推').props.onClick();
  const changeWeight = value => find(render(), node => node.type === 'input' && node.props.placeholder === '例如：150').props.onChange({ target: { value } });
  changeWeight('150');
  for (const value of ['0', '-1', '']) {
    changeWeight(value);
    const modal = find(render(), node => node.type === 'Modal');
    const saveButton = find(modal.props.footer, node => node.type === 'SaveButton');
    assert.equal(saveButton.props.disabled, true);
    await saveButton.props.onClick();
  }
  assert.equal(saves, 0);
});

test('人民幣價格按需展開，空白選填不影響台幣儲存', async () => {
  let saved;
  const render = createForm('../src/components/PurchaseManager/PurchaseModal.tsx', { item: null, categories: ['手機'], onClose() {}, onSave: async value => { saved = value; return true; } });
  const cnyInput = () => find(render(), node => node.type === 'input' && node.props.placeholder === '人民幣金額');
  assert.equal(cnyInput(), undefined);
  find(render(), node => node.type === 'button' && node.props['aria-expanded'] === false).props.onClick();
  assert.ok(cnyInput());
  assert.equal(Boolean(cnyInput().props.required), false);
  find(render(), node => node.type === 'input' && node.props.placeholder === '台幣金額').props.onChange({ target: { value: '500' } });
  await render().props.onSubmit({ preventDefault() {} });
  assert.equal(saved.price, 500);
  assert.equal(saved.priceCny, null);
});

test('編輯人民幣零元紀錄直接展開，移除後不會提交隱藏價格', async () => {
  let saved;
  const render = createForm('../src/components/PurchaseManager/PurchaseModal.tsx', { item: { name: '手機', category: '手機', price: 100, priceCny: 0, beneficiary: '共同', purchaser: '共同', date: '2026-10-23', platform: '門市' }, categories: ['手機'], onClose() {}, onSave: async value => { saved = value; return true; } });
  const input = find(render(), node => node.type === 'input' && node.props.placeholder === '人民幣金額');
  assert.equal(input.props.value, '0');
  find(render(), node => node.type === 'button' && node.props['aria-label'] === '移除人民幣價格').props.onClick();
  assert.equal(find(render(), node => node.type === 'input' && node.props.placeholder === '人民幣金額'), undefined);
  await render().props.onSubmit({ preventDefault() {} });
  assert.equal(saved.priceCny, null);
});
