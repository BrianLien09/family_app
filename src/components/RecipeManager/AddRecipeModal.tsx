'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Plus, Trash2, X } from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/types';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import SaveButton from '@/components/SaveButton';

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

  useImmersiveMode(isOpen);

  const [ingredients, setIngredients] = useState<Omit<RecipeIngredient, 'id'>[]>(() => (
    initialData?.ingredients.map(({ name, amount, unit }) => ({ name, amount, unit })) ?? [{ name: '', amount: 0, unit: 'g' }]
  ));

  // ESC 鍵盤快捷鍵
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 0, unit: 'g' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Omit<RecipeIngredient, 'id'>, value: string | number) => {
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
        alert('請至少加入一項食材');
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-busy={isSubmitting}
      aria-labelledby="recipe-modal-title"
    >
      <div className="glass-panel w-full max-w-lg p-0 bg-[#f0ece1] dark:bg-[#f0ece1] border-2 border-dashed border-dashed border-[#dcd0c2]/50 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] rounded-2xl overflow-hidden text-[#3d3a36]">

        {/* Header */}
        <div className="p-4 border-b border-dashed border-[#dcd0c2]/50 flex justify-between items-center bg-[#b87e6b]/10 to-transparent">
           <div className="flex items-center gap-2 text-[#b87e6b]">
             <ChefHat size={24} />
             {/* 動態顯示標題 */}
             <h2 id="recipe-modal-title" className="text-xl font-bold">{initialData ? '編輯私房食譜' : '新增私房食譜'}</h2>
           </div>
           <button
             disabled={isSubmitting} onClick={close}
             className="text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200"
             aria-label="關閉對話框"
           >
             <X size={24} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <fieldset disabled={isSubmitting} className="min-w-0 space-y-6 border-0 p-0">
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1 pl-1 text-[#3d3a36]">食譜名稱</label>
               <input
                 required
                 className="w-full bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 focus:ring-2 focus:ring-orange-500/30 transition-all hover:bg-[#dcd0c2]/50"
                 placeholder="例如：阿嬤的滷肉"
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 aria-label="食譜名稱"
               />
             </div>

             {/* 烹飪時間區塊 */}
             <div>
                <label className="block text-sm font-medium mb-2 pl-1 text-[#3d3a36]">烹飪時間 (選填)</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      className="flex-1 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                      placeholder="溫度/功率數值 (例: 105)"
                      value={cookingTimeValue}
                      onChange={e => setCookingTimeValue(e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-[80px] bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50 text-center"
                      placeholder="度"
                      value={cookingTimeUnit}
                      onChange={e => setCookingTimeUnit(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      className="flex-1 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                      placeholder="時間分鐘數 (例: 30)"
                      value={cookingTimeMinutes}
                      onChange={e => setCookingTimeMinutes(e.target.value)}
                    />
                    <div className="w-[80px] text-center">
                      <span className="text-[#3d3a36] font-medium whitespace-nowrap">分鐘</span>
                    </div>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1 text-[#3d3a36]">預設份數</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                    value={baseServings}
                    onChange={e => setBaseServings(Number(e.target.value))}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1 text-[#3d3a36]">備註 (選填)</label>
                  <input
                    className="w-full bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                    placeholder="簡單筆記..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
               </div>
             </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-[#3d3a36]">食材清單</label>
                <button type="button" onClick={handleAddIngredient} className="text-xs text-[#b87e6b] hover:text-[#b87e6b] hover:underline flex items-center gap-1 transition-all duration-200">
                    <Plus size={14} /> 新增欄位
                </button>
            </div>

            <div className="space-y-2">
               {ingredients.map((ing, idx) => (
                 <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                    <input
                       className="flex-[2] bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                       placeholder="食材名"
                       value={ing.name}
                       onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    />
                    <input
                       type="number"
                       className="flex-1 min-w-[60px] bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                       placeholder="數量"
                       required={idx === 0}
                       value={ing.amount || ''}
                       onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                    />
                    <input
                       className="flex-1 min-w-[60px] bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-3 text-[#3d3a36] placeholder:text-slate-600 focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
                       placeholder="單位"
                       value={ing.unit}
                       onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-3 text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#b87e6b]/20 rounded-xl transition-all"
                      >
                          <Trash2 size={18} />
                      </button>
                    )}
                 </div>
               ))}
            </div>

            <button type="button" onClick={handleAddIngredient} className="mt-4 w-full py-3 border-2 border-dashed border-dashed border-[#dcd0c2] rounded-xl text-[#3d3a36] hover:border-[#b87e6b]/50 hover:text-[#b87e6b] hover:bg-[#b87e6b]/20 transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> 新增食材
            </button>
          </div>
          </fieldset>
        </form>

        <div className="p-4 border-t border-dashed border-[#dcd0c2]/50 flex justify-end gap-3 bg-[#dcd0c2]/30">
            <button type="button" disabled={isSubmitting} onClick={close} className="px-4 py-2 text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200">取消</button>
            <SaveButton isSubmitting={isSubmitting}
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#b87e6b] hover:bg-[#a66a58] text-[#f0ece1] font-bold rounded-xl shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/20 transition-all active:scale-95"
            >
              {initialData ? '更新食譜' : '儲存食譜'}
            </SaveButton>
        </div>

      </div>
    </div>
  );
}
