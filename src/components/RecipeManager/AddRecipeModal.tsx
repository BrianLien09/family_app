'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/types';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipe: Recipe) => Promise<boolean>; // 改名為 onSubmit 比較通用
  initialData?: Recipe | null;        // 接收舊資料
}

export default function AddRecipeModal({ isOpen, onClose, onSubmit, initialData }: AddRecipeModalProps) {
  const { isSubmitting, submit, close } = useFormSubmission(onClose);

  const [title, setTitle] = useState(() => initialData?.title ?? '');
  const [baseServings, setBaseServings] = useState(() => initialData?.baseServings ?? 1);
  const [description, setDescription] = useState(() => initialData?.description ?? '');

  // 烹飪時間 state
  const [cookingTimeValue, setCookingTimeValue] = useState<string>(() => initialData?.cookingTime ? String(initialData.cookingTime.value) : '');
  const [cookingTimeUnit, setCookingTimeUnit] = useState<string>(() => initialData?.cookingTime?.unit ?? '度');
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState<string>(() => initialData?.cookingTime ? String(initialData.cookingTime.minutes) : '');

  const [ingredientError, setIngredientError] = useState('');
  const focusNewIngredient = useRef(false);
  const firstIngredientInput = useRef<HTMLInputElement>(null);

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(() => (
    initialData?.ingredients.map(ingredient => ({ ...ingredient })) ?? [{ id: crypto.randomUUID(), name: '', amount: 0, unit: 'g' }]
  ));

  const handleAddIngredient = () => {
    // 新增後只聚焦新列，避免其他欄位更新時反覆搶走游標。
    focusNewIngredient.current = true;
    setIngredients([...ingredients, { id: crypto.randomUUID(), name: '', amount: 0, unit: 'g' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Omit<RecipeIngredient, 'id'>, value: string | number) => {
    setIngredientError('');
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const validIngredients = ingredients
      .filter(i => i.name.trim() !== '')
      .map(i => ({
         ...i,
         id: crypto.randomUUID(), // 食材 ID 每次重產生沒關係
         amount: Number(i.amount)
      }));

    if (validIngredients.length === 0) {
        setIngredientError('請至少加入一項食材');
        firstIngredientInput.current?.focus();
        return;
    }

    let cookingTime: Recipe['cookingTime'] = null;
    if (cookingTimeValue && cookingTimeMinutes) {
      cookingTime = {
        value: Number(cookingTimeValue),
        unit: cookingTimeUnit || '度',
        minutes: Number(cookingTimeMinutes)
      };
    }

    const newRecipe: Recipe = {
      // ✨ ID 處理：如果是編輯，沿用舊 ID；如果是新增，產生新 ID
      id: initialData ? initialData.id : crypto.randomUUID(),
      title,
      description,
      baseServings: Number(baseServings),
      ingredients: validIngredients,
      cookingTime
    };

    await submit(() => onSubmit(newRecipe));
  };

  return (
    <Modal isOpen={isOpen} title={initialData ? '編輯私房食譜' : '新增私房食譜'} onClose={close}
      size="wide" isBusy={isSubmitting} onSubmit={handleSubmit}
      footer={<ModalActions onClose={close} isSubmitting={isSubmitting}>{initialData ? '更新食譜' : '儲存食譜'}</ModalActions>}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6 border-0 p-0">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="modal-field">食譜名稱<input required className="modal-input" placeholder="例如：阿嬤的滷肉" value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="modal-field">預設份數<input required type="number" inputMode="decimal" min={Number.MIN_VALUE} step="any" className="modal-input" value={baseServings} onChange={e => setBaseServings(Number(e.target.value))} /></label>
        </div>
        <fieldset className="min-w-0"><legend className="mb-3 text-sm font-medium">烹飪設定（選填）</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="modal-field">溫度／功率<input type="number" inputMode="decimal" className="modal-input" placeholder="例如：105" value={cookingTimeValue} onChange={e => setCookingTimeValue(e.target.value)} /></label>
            <label className="modal-field">單位<input className="modal-input" placeholder="度" value={cookingTimeUnit} onChange={e => setCookingTimeUnit(e.target.value)} /></label>
            <label className="modal-field col-span-2 sm:col-span-1">時間（分鐘）<input type="number" inputMode="decimal" className="modal-input" placeholder="例如：30" value={cookingTimeMinutes} onChange={e => setCookingTimeMinutes(e.target.value)} /></label>
          </div>
        </fieldset>
        <label className="modal-field">備註（選填）<textarea rows={2} className="modal-input resize-y" placeholder="簡單筆記…" value={description} onChange={e => setDescription(e.target.value)} /></label>
        <section aria-labelledby="ingredient-heading" className="space-y-3">
          <h3 id="ingredient-heading" className="text-sm font-bold">食材清單</h3>
          {ingredientError && <p id="recipe-ingredient-error" className="modal-error" role="alert">{ingredientError}</p>}
          {ingredients.map((ingredient, index) => <div key={ingredient.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 rounded-xl border border-[#dcd0c2]/70 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="modal-field col-span-3 sm:col-span-1">食材名稱
              <input className="modal-input" aria-label={`第 ${index + 1} 項食材名稱`} aria-invalid={Boolean(ingredientError)} aria-describedby={ingredientError ? 'recipe-ingredient-error' : undefined} value={ingredient.name} placeholder="例如：麵粉"
                ref={element => {
                  if (index === 0) firstIngredientInput.current = element;
                  if (element && focusNewIngredient.current && index === ingredients.length - 1) {
                    focusNewIngredient.current = false;
                    element.focus();
                  }
                }} onChange={e => updateIngredient(index, 'name', e.target.value)} />
            </label>
            <label className="modal-field">數量<input type="number" inputMode="decimal" min="0" step="any" required={Boolean(ingredient.name.trim())} className="modal-input"
              value={ingredient.amount || ''} placeholder="0" onChange={e => updateIngredient(index, 'amount', Number(e.target.value))} /></label>
            <label className="modal-field">單位<input className="modal-input" value={ingredient.unit} placeholder="g" onChange={e => updateIngredient(index, 'unit', e.target.value)} /></label>
            <button type="button" disabled={ingredients.length === 1} className="modal-icon-button" aria-label={`刪除第 ${index + 1} 項食材`} onClick={() => handleRemoveIngredient(index)}><Trash2 size={18} /></button>
          </div>)}
          <button type="button" className="modal-secondary w-full border-dashed" onClick={handleAddIngredient}><Plus size={18} />新增食材</button>
        </section>
      </fieldset>
    </Modal>
  );
}
