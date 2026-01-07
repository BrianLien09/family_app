'use client';

import { useState, useMemo } from 'react';
import { Recipe } from '@/types';
import { Minus, Plus, Utensils, X, Save, Scale as ScaleIcon, Calculator } from 'lucide-react';
import clsx from 'clsx';

interface RecipeCalculatorProps {
  recipe: Recipe;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAdd: (recipe: Recipe) => void;
}

type ScaleMode = 'servings' | 'ingredient';

export default function RecipeCalculator({ recipe, onClose, onDelete, onAdd }: RecipeCalculatorProps) {
  const [mode, setMode] = useState<ScaleMode>('servings');
  const [scale, setScale] = useState(1);
  const [customServings, setCustomServings] = useState(recipe.baseServings);
  
  // For Ingredient Scaling
  const [refIngredientId, setRefIngredientId] = useState(recipe.ingredients[0]?.id || '');
  const [targetAmount, setTargetAmount] = useState<string>('');

  const handleServingsChange = (newServings: number) => {
    if (newServings < 0.1) return;
    setCustomServings(newServings);
    setScale(newServings / recipe.baseServings);
  };

  const currentRefIngredient = useMemo(() => 
    recipe.ingredients.find(i => i.id === refIngredientId), 
  [recipe.ingredients, refIngredientId]);

  const handleIngredientScale = (val: string) => {
    setTargetAmount(val);
    const num = parseFloat(val);
    if (!num || !currentRefIngredient || currentRefIngredient.amount === 0) return;
    
    // logic: scale = target / original
    const newScale = num / currentRefIngredient.amount;
    setScale(newScale);
    setCustomServings(Math.round(recipe.baseServings * newScale * 10) / 10);
  };

  const handleSaveAsNew = () => {
    const newTitle = `${recipe.title} (${customServings}人份)`;
    const newIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      amount: parseFloat((ing.amount * scale).toFixed(1))
    }));

    onAdd({
      id: Date.now().toString(),
      title: newTitle,
      description: `由 ${recipe.title} 依比例調整而來`,
      baseServings: customServings,
      ingredients: newIngredients
    });
    alert('已另存為新食譜！');
    onClose();
  };

  const formatAmount = (num: number) => {
    return parseFloat(num.toFixed(1)).toString();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg p-0 bg-[#1e293b] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] border border-slate-700">
        
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-orange-900/60 to-amber-900/60 border-b border-orange-500/20">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-1 bg-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/20 transition-all"
           >
             <X size={20} />
           </button>
           
           <div className="flex items-center gap-2 text-orange-400 mb-2">
             <Calculator size={20} />
             <span className="text-sm font-bold tracking-wider uppercase">智慧換算</span>
           </div>
           
           <h2 className="text-2xl font-bold text-white">{recipe.title}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
           {/* Mode Switcher */}
           <div className="p-4 bg-slate-800/50 flex gap-2 border-b border-slate-700">
              <button 
                onClick={() => setMode('servings')}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2",
                  mode === 'servings' ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                )}
              >
                <Utensils size={16} /> 依份量調整
              </button>
              <button 
                onClick={() => setMode('ingredient')}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2",
                  mode === 'ingredient' ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                )}
              >
                <ScaleIcon size={16} /> 依食材反推
              </button>
           </div>

           {/* Controls */}
           <div className="p-6 border-b border-slate-700 bg-slate-800/30">
             {mode === 'servings' ? (
                // Servings Mode
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-400">製作份量</label>
                    <div className="flex items-center gap-3">
                       <button onClick={() => handleServingsChange(customServings - 1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><Minus size={16}/></button>
                       <span className="text-2xl font-bold text-white w-16 text-center">{formatAmount(customServings)}</span>
                       <button onClick={() => handleServingsChange(customServings + 1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><Plus size={16}/></button>
                    </div>
                  </div>
                  <input 
                    type="range" min="0.5" max={Math.max(10, recipe.baseServings * 3)} step="0.5"
                    value={customServings}
                    onChange={(e) => handleServingsChange(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center text-xs text-slate-500">
                    目前倍率: <span className="text-orange-400 font-bold">{scale.toFixed(2)}x</span>
                  </div>
                </div>
             ) : (
                // Ingredient Mode
                <div className="flex flex-col gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">1. 選擇已知食材</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-purple-500"
                        value={refIngredientId}
                        onChange={(e) => {
                          setRefIngredientId(e.target.value);
                          setTargetAmount(''); // reset input
                        }}
                      >
                        {recipe.ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name} (原: {ing.amount} {ing.unit})</option>
                        ))}
                      </select>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">2. 輸入現有重量</label>
                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="例如: 150"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 font-mono text-lg"
                          value={targetAmount}
                          onChange={(e) => handleIngredientScale(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                           {currentRefIngredient?.unit}
                        </span>
                      </div>
                   </div>
                   
                   <div className="text-center text-xs text-slate-500 pt-2">
                     自動推算份量: <span className="text-purple-400 font-bold">{customServings.toFixed(1)} 人份</span> (倍率 {scale.toFixed(2)}x)
                   </div>
                </div>
             )}
           </div>

           {/* Ingredients Table */}
           <div className="p-6">
              <h3 className="text-sm font-bold text-slate-400 mb-4 flex justify-between">
                <span>所需食材清單</span>
                {mode === 'ingredient' && <span className="text-purple-400 text-xs">依 {targetAmount || '?'} {currentRefIngredient?.unit} {currentRefIngredient?.name} 推算</span>}
              </h3>
              <div className="space-y-2">
                {recipe.ingredients.map(ing => (
                  <div key={ing.id} className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border",
                    // Highlight the reference ingredient in ingredient mode
                    (mode === 'ingredient' && ing.id === refIngredientId) 
                      ? "bg-purple-500/10 border-purple-500/30" 
                      : "bg-slate-800/50 border-slate-700"
                  )}>
                     <span className={clsx("font-medium", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-purple-300" : "text-slate-300")}>
                        {ing.name}
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className={clsx("text-lg font-bold font-mono", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-purple-400" : "text-orange-400")}>
                           {formatAmount(ing.amount * scale)}
                        </span>
                        <span className="text-xs text-slate-500">{ing.unit}</span>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-[#161b2c] flex justify-between gap-3">
           <button 
             onClick={() => onDelete(recipe.id)}
             className="text-red-400 text-sm px-4 hover:bg-red-500/10 rounded-lg transition-colors"
           >
             刪除
           </button>
           <div className="flex gap-3">
             <button 
               onClick={handleSaveAsNew}
               className="btn bg-slate-700 hover:bg-slate-600 text-white px-4 flex items-center gap-2"
             >
               <Save size={18} />
               另存新食譜
             </button>
             <button 
               onClick={onClose}
               className="btn bg-orange-600 hover:bg-orange-500 text-white px-6"
             >
               關閉
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
