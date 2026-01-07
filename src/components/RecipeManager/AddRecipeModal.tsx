'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Plus, Trash2, X } from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/types';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipe: Recipe) => void; // 改名為 onSubmit 比較通用
  initialData?: Recipe | null;        // 接收舊資料
}

export default function AddRecipeModal({ isOpen, onClose, onSubmit, initialData }: AddRecipeModalProps) {
  const [title, setTitle] = useState('');
  const [baseServings, setBaseServings] = useState(1);
  const [description, setDescription] = useState('');
  useImmersiveMode(isOpen);
  
  const [ingredients, setIngredients] = useState<Omit<RecipeIngredient, 'id'>[]>([
      { name: '', amount: 0, unit: 'g' }
  ]);

  // ✨ 關鍵邏輯：監聽視窗開啟狀態與初始資料
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // ✏️ 編輯模式：帶入舊資料
        setTitle(initialData.title);
        setBaseServings(initialData.baseServings);
        setDescription(initialData.description || '');
        
        // 把舊的食材資料填進去 (只要名、量、單位)
        setIngredients(initialData.ingredients.map(i => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit
        })));
      } else {
        // ➕ 新增模式：重置所有欄位
        setTitle('');
        setBaseServings(1);
        setDescription('');
        setIngredients([{ name: '', amount: 0, unit: 'g' }]);
      }
    }
  }, [isOpen, initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
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

    const newRecipe: Recipe = {
      // ✨ ID 處理：如果是編輯，沿用舊 ID；如果是新增，產生新 ID
      id: initialData ? initialData.id : crypto.randomUUID(),
      title,
      description,
      baseServings: Number(baseServings),
      ingredients: validIngredients
    };

    onSubmit(newRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-0 bg-[#1a1f3c] dark:bg-slate-900/95 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] rounded-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-orange-500/10 to-transparent">
           <div className="flex items-center gap-2 text-orange-400">
             <ChefHat size={24} />
             {/* 動態顯示標題 */}
             <h2 className="text-xl font-bold">{initialData ? '編輯私房食譜' : '新增私房食譜'}</h2>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1 pl-1 text-slate-300">食譜名稱</label>
               <input 
                 required
                 className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                 placeholder="例如：阿嬤的滷肉" 
                 value={title}
                 onChange={e => setTitle(e.target.value)}
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1 text-slate-300">預設份數</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                    value={baseServings}
                    onChange={e => setBaseServings(Number(e.target.value))}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1 text-slate-300">備註 (選填)</label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                    placeholder="簡單筆記..." 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
               </div>
             </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-300">食材清單</label>
                <button type="button" onClick={handleAddIngredient} className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 transition-colors">
                    <Plus size={14} /> 新增欄位
                </button>
            </div>
            
            <div className="space-y-2">
               {ingredients.map((ing, idx) => (
                 <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                    <input 
                       className="flex-[2] bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                       placeholder="食材名"
                       value={ing.name}
                       onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    />
                    <input 
                       type="number"
                       className="flex-1 min-w-[60px] bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                       placeholder="數量"
                       required={idx === 0}
                       value={ing.amount || ''}
                       onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                    />
                    <input 
                       className="flex-1 min-w-[60px] bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-black/30"
                       placeholder="單位"
                       value={ing.unit}
                       onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                          <Trash2 size={18} />
                      </button>
                    )}
                 </div>
               ))}
            </div>
            
            <button type="button" onClick={handleAddIngredient} className="mt-4 w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> 新增食材
            </button>
          </div>
        </form>

        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">取消</button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              {initialData ? '更新食譜' : '儲存食譜'}
            </button>
        </div>

      </div>
    </div>
  );
}