'use client';

import { useState } from 'react';
import { ChefHat, Minus, Plus, Trash2, X } from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/types';
import clsx from 'clsx';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipe: Recipe) => void;
}

export default function AddRecipeModal({ isOpen, onClose, onAdd }: AddRecipeModalProps) {
  const [title, setTitle] = useState('');
  const [baseServings, setBaseServings] = useState(1);
  const [description, setDescription] = useState('');
  
  const [ingredients, setIngredients] = useState<Omit<RecipeIngredient, 'id'>[]>([
      { name: '', amount: 0, unit: 'g' }
  ]);

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
    
    // Filter out empty ingredients
    const validIngredients = ingredients
      .filter(i => i.name.trim() !== '')
      .map(i => ({
         ...i,
         id: crypto.randomUUID(),
         amount: Number(i.amount)
      }));

    if (validIngredients.length === 0) {
        alert('請至少加入一項食材');
        return;
    }

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      title,
      description,
      baseServings: Number(baseServings),
      ingredients: validIngredients
    };

    onAdd(newRecipe);
    
    // Reset
    setTitle('');
    setDescription('');
    setBaseServings(1);
    setIngredients([{ name: '', amount: 0, unit: 'g' }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-0 bg-white/95 dark:bg-slate-900/95 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
           <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
             <ChefHat size={24} />
             <h2 className="text-xl font-bold">新增私房食譜</h2>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-black">
             <X size={24} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1 pl-1">食譜名稱</label>
               <input 
                 required
                 className="input"
                 placeholder="例如：阿嬤的滷肉" 
                 value={title}
                 onChange={e => setTitle(e.target.value)}
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1">預設份數</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    className="input"
                    value={baseServings}
                    onChange={e => setBaseServings(Number(e.target.value))}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 pl-1">備註 (選填)</label>
                  <input 
                    className="input"
                    placeholder="簡單筆記..." 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
               </div>
             </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">食材清單</label>
                <button type="button" onClick={handleAddIngredient} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <Plus size={14} /> 新增欄位
                </button>
            </div>
            
            <div className="space-y-2">
               {ingredients.map((ing, idx) => (
                 <div key={idx} className="flex gap-2 items-start">
                    <input 
                       className="input flex-[2]"
                       placeholder="食材名 (如：豬肉)"
                       value={ing.name}
                       onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    />
                    <input 
                       type="number"
                       className="input flex-1 min-w-[60px]"
                       placeholder="數量"
                       required={idx === 0}
                       value={ing.amount || ''}
                       onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                    />
                    <input 
                       className="input flex-1 min-w-[60px]"
                       placeholder="單位"
                       value={ing.unit}
                       onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                    />
                    {ingredients.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                         <Trash2 size={18} />
                      </button>
                    )}
                 </div>
               ))}
            </div>
            <button type="button" onClick={handleAddIngredient} className="mt-2 w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> 新增食材
            </button>
          </div>
        </form>

        <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-black/20">
            <button type="button" onClick={onClose} className="btn btn-ghost">取消</button>
            <button type="button" onClick={handleSubmit} className="btn btn-primary bg-orange-500 hover:bg-orange-600">儲存食譜</button>
        </div>

      </div>
    </div>
  );
}
