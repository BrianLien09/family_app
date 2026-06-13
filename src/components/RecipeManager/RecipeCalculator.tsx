'use client';

import { useState, useMemo, useRef } from 'react';
import { Recipe } from '@/types';
import { Minus, Plus, Utensils, X, Save, Scale as ScaleIcon, Calculator, Edit, Trash2, ChevronRight, FileDown } from 'lucide-react';
import clsx from 'clsx';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RecipeCalculatorProps {
  recipe: Recipe;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAdd: (recipe: Recipe) => void;
  onEdit: () => void;
}

type ScaleMode = 'servings' | 'ingredient';

export default function RecipeCalculator({ recipe, onClose, onDelete, onAdd, onEdit }: RecipeCalculatorProps) {
  const [mode, setMode] = useState<ScaleMode>('servings');
  const [scale, setScale] = useState(1);
  const [customServings, setCustomServings] = useState(recipe.baseServings);
  const [refIngredientId, setRefIngredientId] = useState(recipe.ingredients[0]?.id || '');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const pdfContentRef = useRef<HTMLDivElement>(null); // PDF 內容容器

  // ✨ 自動隱藏導航列 (Immersive Mode)
  useImmersiveMode(true);

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
  
  /**
   * 匯出 PDF - 使用 html2canvas 轉換 HTML 為圖片後生成 PDF
   * 完美支援中文顯示
   */
  const handleExportPDF = async () => {
    if (!pdfContentRef.current) return;

    try {
      // 捕獲 HTML 內容為 Canvas
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2, // 提高清晰度
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 寬度 (mm)
      const pageHeight = 297; // A4 高度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 加入第一頁
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果內容超過一頁，自動分頁
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 儲存檔案
      const fileName = `${recipe.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${customServings}人份.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 匯出失敗:', error);
      alert('匯出失敗，請稍後再試');
    }
  };

  // ------------------------------------------------------------------
  // 📱 Mobile View (手機版介面) - 完全使用你提供的代碼樣式
  // ------------------------------------------------------------------
  const MobileLayout = () => (
    <div className="glass-panel w-full max-w-lg p-0 bg-[#f0ece1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-2 border-dashed border-[#dcd0c2] rounded-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-[#b87e6b]/10 border-b border-[#b87e6b]/50">
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={onEdit} className="p-2 bg-[#dcd0c2]/30 rounded-full text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30 transition-all"><Edit size={18} /></button>
                <button onClick={() => onDelete(recipe.id)} className="p-2 bg-[#dcd0c2]/30 rounded-full text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#b87e6b]/20 transition-all"><Trash2 size={18} /></button>
                <button onClick={onClose} className="p-2 bg-[#dcd0c2]/30 rounded-full text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30 transition-all"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 text-[#b87e6b] mb-2">
                <Calculator size={20} />
                <span className="text-sm font-bold tracking-wider uppercase">智慧換算</span>
            </div>
            <h2 className="text-2xl font-bold text-[#3d3a36] pr-24 line-clamp-1">{recipe.title}</h2>
            {recipe.cookingTime && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b87e6b]/20 text-[#b87e6b] text-xs font-medium border-2 border-dashed border-[#b87e6b]/50 w-fit">
                <span>⏱️</span> {recipe.cookingTime.value}{recipe.cookingTime.unit} {recipe.cookingTime.minutes}分鐘
              </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Mode Switcher */}
            <div className="p-4 bg-[#f0ece1] flex gap-2 border-b border-[#dcd0c2]">
                <button onClick={() => setMode('servings')} className={clsx("flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2", mode === 'servings' ? "bg-[#b87e6b] text-[#f0ece1]" : "bg-[#dcd0c2]/50 text-[#3d3a36] hover:bg-[#dcd0c2]/80")}>
                    <Utensils size={16} /> 依份量調整
                </button>
                <button onClick={() => setMode('ingredient')} className={clsx("flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2", mode === 'ingredient' ? "bg-[#5f7186] text-[#f0ece1]" : "bg-[#dcd0c2]/50 text-[#3d3a36] hover:bg-[#dcd0c2]/80")}>
                    <ScaleIcon size={16} /> 依食材反推
                </button>
            </div>

            {/* Controls */}
            <div className="p-6 border-b border-[#dcd0c2] bg-[#f0ece1]">
                {mode === 'servings' ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-[#3d3a36]">製作份量</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleServingsChange(customServings - 1)} className="p-1.5 rounded-full bg-[#dcd0c2]/50 hover:bg-[#dcd0c2]/80 text-[#3d3a36]"><Minus size={16}/></button>
                                <span className="text-2xl font-bold text-[#3d3a36] w-16 text-center">{formatAmount(customServings)}</span>
                                <button onClick={() => handleServingsChange(customServings + 1)} className="p-1.5 rounded-full bg-[#dcd0c2]/50 hover:bg-[#dcd0c2]/80 text-[#3d3a36]"><Plus size={16}/></button>
                            </div>
                        </div>
                        <input type="range" min="0.5" max={Math.max(10, recipe.baseServings * 3)} step="0.5" value={customServings} onChange={(e) => handleServingsChange(parseFloat(e.target.value))} className="w-full accent-[#b87e6b] h-2 bg-[#dcd0c2]/50 rounded-lg appearance-none cursor-pointer" />
                        <div className="text-center text-xs text-[#3d3a36]">目前倍率: <span className="text-[#b87e6b] font-bold">{scale.toFixed(2)}x</span></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#3d3a36] uppercase">1. 選擇已知食材</label>
                            <select className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg p-3 text-[#3d3a36] outline-none focus:border-[#b87e6b]" value={refIngredientId} onChange={(e) => { setRefIngredientId(e.target.value); setTargetAmount(''); }}>
                                {recipe.ingredients.map(ing => ( <option key={ing.id} value={ing.id}>{ing.name} (原: {ing.amount} {ing.unit})</option> ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#3d3a36] uppercase">2. 輸入現有重量</label>
                            <div className="relative">
                                <input type="number" placeholder="例如: 150" className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg p-3 text-[#3d3a36] outline-none focus:border-[#b87e6b] font-mono text-lg" value={targetAmount} onChange={(e) => handleIngredientScale(e.target.value)} />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d3a36] font-bold">{currentRefIngredient?.unit}</span>
                            </div>
                        </div>
                        <div className="text-center text-xs text-[#3d3a36] pt-2">自動推算份量: <span className="text-[#5f7186] font-bold">{customServings.toFixed(1)} 人份</span> (倍率 {scale.toFixed(2)}x)</div>
                    </div>
                )}
            </div>

            {/* Ingredients Table */}
            <div className="p-6">
                <h3 className="text-sm font-bold text-[#3d3a36] mb-4 flex justify-between">
                    <span>所需食材清單</span>
                    {mode === 'ingredient' && <span className="text-[#5f7186] text-xs">依 {targetAmount || '?'} {currentRefIngredient?.unit} {currentRefIngredient?.name} 推算</span>}
                </h3>
                <div className="space-y-2">
                    {recipe.ingredients.map(ing => (
                        <div key={ing.id} className={clsx("flex items-center justify-between p-3 rounded-lg border", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-[#5f7186]/10 border-[#5f7186]/50" : "bg-[#f0ece1] border-[#dcd0c2]")}>
                            <span className={clsx("font-medium", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-[#5f7186]" : "text-[#3d3a36]")}>{ing.name}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={clsx("text-lg font-bold font-mono", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-[#5f7186]" : "text-[#b87e6b]")}>{formatAmount(ing.amount * scale)}</span>
                                <span className="text-xs text-[#3d3a36]">{ing.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#dcd0c2] bg-[#f0ece1] flex justify-end gap-3">
            <button onClick={handleExportPDF} className="btn bg-blue-600 hover:bg-blue-500 text-[#3d3a36] px-4 flex items-center gap-2" title="匯出為 PDF"><FileDown size={18} /> PDF</button>
            <button onClick={handleSaveAsNew} className="btn bg-[#dcd0c2]/50 hover:bg-[#dcd0c2]/80 text-[#3d3a36] px-4 flex items-center gap-2"><Save size={18} /> 另存新食譜</button>
            <button onClick={onClose} className="btn bg-[#b87e6b] hover:bg-[#b87e6b] text-[#f0ece1] px-6">關閉</button>
        </div>
    </div>
  );

  // ------------------------------------------------------------------
  // 💻 Desktop View (平板/電腦版介面) - 使用全螢幕儀表板樣式
  // ------------------------------------------------------------------
  const DesktopLayout = () => (
    <div className="glass-panel w-full h-[90vh] max-w-6xl p-0 bg-[#f0ece1] shadow-2xl overflow-hidden flex flex-col border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-3xl">
        {/* Header - Fixed */}
        <div className="relative p-6 border-b border-dashed border-[#dcd0c2]/50 flex items-center justify-between bg-black/20 shrink-0 z-40">
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-[#b87e6b]">
               <Calculator size={18} />
               <span className="text-xs font-bold tracking-[0.2em] uppercase">Smart Kitchen AI</span>
             </div>
             <div className="flex items-center gap-4 flex-wrap">
               <h2 className="text-3xl font-bold text-[#3d3a36] tracking-tight line-clamp-1">{recipe.title}</h2>
               {recipe.cookingTime && (
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b87e6b]/20 text-[#b87e6b] text-sm font-medium border-2 border-dashed border-[#b87e6b]/50 whitespace-nowrap h-fit">
                   <span>⏱️</span> {recipe.cookingTime.value}{recipe.cookingTime.unit} {recipe.cookingTime.minutes}分鐘
                 </div>
               )}
             </div>
           </div>

           <div className="flex gap-3">
             <button onClick={onEdit} className="p-3 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-full text-[#3d3a36] hover:text-[#b87e6b] transition-all" title="編輯"><Edit size={20} /></button>
             <button onClick={() => onDelete(recipe.id)} className="p-3 bg-[#dcd0c2]/30 hover:bg-[#b87e6b]/20 rounded-full text-[#3d3a36] hover:text-[#b87e6b] transition-all" title="刪除"><Trash2 size={20} /></button>
             <button onClick={onClose} className="p-3 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/30 rounded-full text-[#3d3a36] transition-all"><X size={24} /></button>
           </div>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           <div className="grid grid-cols-12 min-h-full">
              {/* Left: Sticky Controls */}
              <div className="col-span-4 sticky top-0 z-30 h-fit bg-[#f0ece1]/95 backdrop-blur-xl p-8 flex flex-col gap-8 border-r border-dashed border-[#dcd0c2]/50 shadow-2xl">
                 <div className="p-1 bg-black/40 rounded-xl flex gap-1 border-2 border-dashed border-dashed border-[#dcd0c2]/50">
                    <button onClick={() => setMode('servings')} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", mode === 'servings' ? "bg-gradient-to-br bg-[#b87e6b]  text-[#3d3a36] shadow-[0_8px_20px_rgba(139,121,101,0.08)]" : "text-[#3d3a36] hover:text-[#3d3a36]")}><Utensils size={16} /> 依份量</button>
                    <button onClick={() => setMode('ingredient')} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", mode === 'ingredient' ? "bg-[#5f7186] text-[#3d3a36] shadow-[0_8px_20px_rgba(139,121,101,0.08)]" : "text-[#3d3a36] hover:text-[#3d3a36]")}><ScaleIcon size={16} /> 依食材</button>
                 </div>

                 <div className="flex flex-col">
                   {mode === 'servings' ? (
                     <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                       <div className="text-center">
                         <label className="text-xs font-bold text-[#3d3a36] uppercase tracking-widest mb-2 block">目標份數</label>
                         <div className="flex items-center justify-center gap-6">
                            <button onClick={() => handleServingsChange(customServings - 0.5)} className="w-12 h-12 rounded-2xl bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 text-[#3d3a36] flex items-center justify-center border-2 border-dashed border-dashed border-[#dcd0c2]/50 active:scale-95"><Minus size={24}/></button>
                            <span className="text-6xl font-black  text-[#3d3a36] tabular-nums">{formatAmount(customServings)}</span>
                            <button onClick={() => handleServingsChange(customServings + 0.5)} className="w-12 h-12 rounded-2xl bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 text-[#3d3a36] flex items-center justify-center border-2 border-dashed border-dashed border-[#dcd0c2]/50 active:scale-95"><Plus size={24}/></button>
                         </div>
                       </div>
                       <div className="bg-[#b87e6b]/20 rounded-2xl p-6 border-2 border-dashed border-[#b87e6b]/50">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[#b87e6b] text-sm font-bold">縮放倍率</span>
                             <span className="text-2xl font-bold text-[#b87e6b]">{scale.toFixed(2)}x</span>
                          </div>
                          <input type="range" min="0.1" max={Math.max(5, recipe.baseServings * 2)} step="0.1" value={customServings} onChange={(e) => handleServingsChange(parseFloat(e.target.value))} className="w-full h-2 bg-black/40 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#b87e6b] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#161b2c]" />
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-[#3d3a36] uppercase tracking-widest">鎖定基準食材</label>
                           <div className="relative">
                             <select className="w-full bg-black/40 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-4 text-[#3d3a36] outline-none focus:border-[#b87e6b] appearance-none" value={refIngredientId} onChange={(e) => { setRefIngredientId(e.target.value); setTargetAmount(''); }}>
                               {recipe.ingredients.map(ing => ( <option key={ing.id} value={ing.id}>{ing.name}</option> ))}
                             </select>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-[#3d3a36] uppercase tracking-widest">輸入現有重量</label>
                           <div className="relative group">
                             <input type="number" placeholder="0" className="w-full bg-black/40 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl p-4 text-4xl font-bold text-[#3d3a36] outline-none focus:border-[#b87e6b] tabular-nums placeholder:text-slate-700" value={targetAmount} onChange={(e) => handleIngredientScale(e.target.value)} />
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#3d3a36] font-bold text-xl">{currentRefIngredient?.unit}</span>
                           </div>
                        </div>
                        <div className="text-center p-4 bg-[#5f7186]/10 rounded-xl border-2 border-dashed border-[#5f7186]/50">
                           <p className="text-[#3d3a36] text-sm mb-1">推算結果</p>
                           <p className="text-2xl font-bold text-[#5f7186]">{customServings.toFixed(1)} 人份 <span className="text-sm text-[#3d3a36] opacity-60">({scale.toFixed(2)}x)</span></p>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

              {/* Right: Ingredient List */}
              <div className="col-span-8 p-10 bg-[#f0ece1] relative z-0">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-bold text-[#3d3a36] flex items-center gap-3"><span className="w-1 h-6 bg-gradient-to-b bg-[#b87e6b]  rounded-full"></span>食材準備清單</h3>
                   {mode === 'ingredient' && <span className="text-xs px-3 py-1 rounded-full bg-[#5f7186]/10 text-[#5f7186] border-2 border-dashed border-[#5f7186]/50">自動推算模式</span>}
                 </div>

                 <div className="grid grid-cols-1 gap-3 pb-8">
                   {recipe.ingredients.map(ing => (
                     <div key={ing.id} className={clsx("group flex items-center justify-between p-4 rounded-2xl border-2 border-dashed transition-all duration-300", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-[#5f7186]/10 border-[#5f7186]/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]" : "bg-white/[0.03] border-dashed border-[#dcd0c2]/50 hover:bg-white/[0.06] hover:border-dashed border-[#dcd0c2]/50")}>
                         <div className="flex items-center gap-4">
                            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-[#5f7186] text-[#f0ece1]" : "bg-[#dcd0c2]/30 text-[#3d3a36] group-hover:bg-[#b87e6b] group-hover:text-[#b87e6b] transition-all duration-200")}>{ing.name.charAt(0)}</div>
                            <span className={clsx("text-lg font-medium", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-[#3d3a36]" : "text-[#3d3a36]")}>{ing.name}</span>
                         </div>
                         <div className="flex items-baseline gap-2 text-right">
                            <span className={clsx("text-3xl font-bold font-mono tracking-tight", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-[#5f7186]" : "text-[#b87e6b]")}>{formatAmount(ing.amount * scale)}</span>
                            <span className="text-sm font-bold text-[#3d3a36] uppercase w-8">{ing.unit}</span>
                         </div>
                      </div>
                   ))}
                 </div>

                  {/* Desktop Footer Actions */}
                  <div className="mt-8 flex justify-end gap-4 border-t border-dashed border-[#dcd0c2]/50 pt-8">
                      <button onClick={handleExportPDF} className="btn bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-dashed border-blue-500/30"><FileDown size={18} />匯出 PDF</button>
                      <button onClick={handleSaveAsNew} className="btn bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/30 text-[#3d3a36] px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-dashed border-dashed border-[#dcd0c2]/50"><Save size={18} />另存為新食譜</button>
                      <button onClick={onClose} className="btn bg-gradient-to-r bg-[#b87e6b] to-pink-600 hover:bg-[#a66a58] text-[#f0ece1] px-10 h-12 rounded-xl font-bold shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/30">完成</button>
                  </div>
              </div>
           </div>
        </div>
    </div>
  );

  return (
    <>
      {/* 📄 隱藏的 PDF 內容區域 (用於 html2canvas 捕獲) */}
      <div 
        ref={pdfContentRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          padding: '20mm',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            {recipe.title}
          </h1>
          <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>📊 目標份數: <strong>{customServings} 人份</strong></span>
            <span>🔢 縮放倍率: <strong>{scale.toFixed(2)}x</strong></span>
            <span>📋 基準份數: {recipe.baseServings} 人份</span>
            {recipe.cookingTime && (
              <span style={{ color: '#ea580c' }}>⏱️ 烹飪時間: <strong>{recipe.cookingTime.value}{recipe.cookingTime.unit} {recipe.cookingTime.minutes}分鐘</strong></span>
            )}
          </div>
          {recipe.description && (
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
              {recipe.description}
            </p>
          )}
        </div>

        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>
            🥘 食材清單
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipe.ingredients.map((ing, index) => (
              <div 
                key={ing.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                  {index + 1}. {ing.name}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c' }}>
                  {formatAmount(ing.amount * scale)} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
          由 Recipe Calculator 生成 • {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 外層容器 (高 z-index) */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          {/* 手機版顯示 MobileLayout */}
          <div className="md:hidden w-full max-w-lg">
              {MobileLayout()}
          </div>
          
          {/* 平板/電腦版顯示 DesktopLayout */}
          <div className="hidden md:block w-full max-w-6xl">
              {DesktopLayout()}
          </div>
      </div>
    </>
  );
}