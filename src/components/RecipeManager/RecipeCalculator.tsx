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
    <div className="glass-panel w-full max-w-lg p-0 bg-[#1e293b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700 rounded-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-orange-900/60 to-amber-900/60 border-b border-orange-500/20">
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={onEdit} className="p-2 bg-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/20 transition-all"><Edit size={18} /></button>
                <button onClick={() => onDelete(recipe.id)} className="p-2 bg-white/10 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={18} /></button>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/20 transition-all"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Calculator size={20} />
                <span className="text-sm font-bold tracking-wider uppercase">智慧換算</span>
            </div>
            <h2 className="text-2xl font-bold text-white pr-24 line-clamp-1">{recipe.title}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {/* Mode Switcher */}
            <div className="p-4 bg-slate-800/50 flex gap-2 border-b border-slate-700">
                <button onClick={() => setMode('servings')} className={clsx("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'servings' ? "bg-orange-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600")}>
                    <Utensils size={16} /> 依份量調整
                </button>
                <button onClick={() => setMode('ingredient')} className={clsx("flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2", mode === 'ingredient' ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600")}>
                    <ScaleIcon size={16} /> 依食材反推
                </button>
            </div>

            {/* Controls */}
            <div className="p-6 border-b border-slate-700 bg-slate-800/30">
                {mode === 'servings' ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">製作份量</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleServingsChange(customServings - 1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><Minus size={16}/></button>
                                <span className="text-2xl font-bold text-white w-16 text-center">{formatAmount(customServings)}</span>
                                <button onClick={() => handleServingsChange(customServings + 1)} className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white"><Plus size={16}/></button>
                            </div>
                        </div>
                        <input type="range" min="0.5" max={Math.max(10, recipe.baseServings * 3)} step="0.5" value={customServings} onChange={(e) => handleServingsChange(parseFloat(e.target.value))} className="w-full accent-orange-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <div className="text-center text-xs text-slate-500">目前倍率: <span className="text-orange-400 font-bold">{scale.toFixed(2)}x</span></div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">1. 選擇已知食材</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-purple-500" value={refIngredientId} onChange={(e) => { setRefIngredientId(e.target.value); setTargetAmount(''); }}>
                                {recipe.ingredients.map(ing => ( <option key={ing.id} value={ing.id}>{ing.name} (原: {ing.amount} {ing.unit})</option> ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">2. 輸入現有重量</label>
                            <div className="relative">
                                <input type="number" placeholder="例如: 150" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 font-mono text-lg" value={targetAmount} onChange={(e) => handleIngredientScale(e.target.value)} />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{currentRefIngredient?.unit}</span>
                            </div>
                        </div>
                        <div className="text-center text-xs text-slate-500 pt-2">自動推算份量: <span className="text-purple-400 font-bold">{customServings.toFixed(1)} 人份</span> (倍率 {scale.toFixed(2)}x)</div>
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
                        <div key={ing.id} className={clsx("flex items-center justify-between p-3 rounded-lg border", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-purple-500/10 border-purple-500/30" : "bg-slate-800/50 border-slate-700")}>
                            <span className={clsx("font-medium", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-purple-300" : "text-slate-300")}>{ing.name}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={clsx("text-lg font-bold font-mono", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-purple-400" : "text-orange-400")}>{formatAmount(ing.amount * scale)}</span>
                                <span className="text-xs text-slate-500">{ing.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-[#161b2c] flex justify-end gap-3">
            <button onClick={handleExportPDF} className="btn bg-blue-600 hover:bg-blue-500 text-white px-4 flex items-center gap-2" title="匯出為 PDF"><FileDown size={18} /> PDF</button>
            <button onClick={handleSaveAsNew} className="btn bg-slate-700 hover:bg-slate-600 text-white px-4 flex items-center gap-2"><Save size={18} /> 另存新食譜</button>
            <button onClick={onClose} className="btn bg-orange-600 hover:bg-orange-500 text-white px-6">關閉</button>
        </div>
    </div>
  );

  // ------------------------------------------------------------------
  // 💻 Desktop View (平板/電腦版介面) - 使用全螢幕儀表板樣式
  // ------------------------------------------------------------------
  const DesktopLayout = () => (
    <div className="glass-panel w-full h-[90vh] max-w-6xl p-0 bg-[#161b2c] shadow-2xl overflow-hidden flex flex-col border border-white/10 rounded-3xl">
        {/* Header - Fixed */}
        <div className="relative p-6 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0 z-40">
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-orange-400">
               <Calculator size={18} />
               <span className="text-xs font-bold tracking-[0.2em] uppercase">Smart Kitchen AI</span>
             </div>
             <h2 className="text-3xl font-bold text-white tracking-tight line-clamp-1">{recipe.title}</h2>
           </div>

           <div className="flex gap-3">
             <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all" title="編輯"><Edit size={20} /></button>
             <button onClick={() => onDelete(recipe.id)} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition-all" title="刪除"><Trash2 size={20} /></button>
             <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><X size={24} /></button>
           </div>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
           <div className="grid grid-cols-12 min-h-full">
              {/* Left: Sticky Controls */}
              <div className="col-span-4 sticky top-0 z-30 h-fit bg-[#161b2c]/95 backdrop-blur-xl p-8 flex flex-col gap-8 border-r border-white/5 shadow-2xl">
                 <div className="p-1 bg-black/40 rounded-xl flex gap-1 border border-white/5">
                    <button onClick={() => setMode('servings')} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", mode === 'servings' ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}><Utensils size={16} /> 依份量</button>
                    <button onClick={() => setMode('ingredient')} className={clsx("flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", mode === 'ingredient' ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}><ScaleIcon size={16} /> 依食材</button>
                 </div>

                 <div className="flex flex-col">
                   {mode === 'servings' ? (
                     <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                       <div className="text-center">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">目標份數</label>
                         <div className="flex items-center justify-center gap-6">
                            <button onClick={() => handleServingsChange(customServings - 0.5)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-95"><Minus size={24}/></button>
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tabular-nums">{formatAmount(customServings)}</span>
                            <button onClick={() => handleServingsChange(customServings + 0.5)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-95"><Plus size={24}/></button>
                         </div>
                       </div>
                       <div className="bg-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-orange-400 text-sm font-bold">縮放倍率</span>
                             <span className="text-2xl font-bold text-orange-400">{scale.toFixed(2)}x</span>
                          </div>
                          <input type="range" min="0.1" max={Math.max(5, recipe.baseServings * 2)} step="0.1" value={customServings} onChange={(e) => handleServingsChange(parseFloat(e.target.value))} className="w-full h-2 bg-black/40 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#161b2c]" />
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">鎖定基準食材</label>
                           <div className="relative">
                             <select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 appearance-none" value={refIngredientId} onChange={(e) => { setRefIngredientId(e.target.value); setTargetAmount(''); }}>
                               {recipe.ingredients.map(ing => ( <option key={ing.id} value={ing.id}>{ing.name}</option> ))}
                             </select>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">輸入現有重量</label>
                           <div className="relative group">
                             <input type="number" placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-4xl font-bold text-white outline-none focus:border-purple-500 tabular-nums placeholder:text-slate-700" value={targetAmount} onChange={(e) => handleIngredientScale(e.target.value)} />
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">{currentRefIngredient?.unit}</span>
                           </div>
                        </div>
                        <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                           <p className="text-slate-400 text-sm mb-1">推算結果</p>
                           <p className="text-2xl font-bold text-purple-300">{customServings.toFixed(1)} 人份 <span className="text-sm text-slate-500 opacity-60">({scale.toFixed(2)}x)</span></p>
                        </div>
                     </div>
                   )}
                 </div>
              </div>

              {/* Right: Ingredient List */}
              <div className="col-span-8 p-10 bg-[#161b2c] relative z-0">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-bold text-white flex items-center gap-3"><span className="w-1 h-6 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full"></span>食材準備清單</h3>
                   {mode === 'ingredient' && <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">自動推算模式</span>}
                 </div>

                 <div className="grid grid-cols-1 gap-3 pb-8">
                   {recipe.ingredients.map(ing => (
                     <div key={ing.id} className={clsx("group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10")}>
                         <div className="flex items-center gap-4">
                            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", (mode === 'ingredient' && ing.id === refIngredientId) ? "bg-purple-500 text-white" : "bg-white/10 text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-colors")}>{ing.name.charAt(0)}</div>
                            <span className={clsx("text-lg font-medium", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-white" : "text-slate-200")}>{ing.name}</span>
                         </div>
                         <div className="flex items-baseline gap-2 text-right">
                            <span className={clsx("text-3xl font-bold font-mono tracking-tight", (mode === 'ingredient' && ing.id === refIngredientId) ? "text-purple-300" : "text-orange-400")}>{formatAmount(ing.amount * scale)}</span>
                            <span className="text-sm font-bold text-slate-500 uppercase w-8">{ing.unit}</span>
                         </div>
                      </div>
                   ))}
                 </div>

                  {/* Desktop Footer Actions */}
                  <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-8">
                      <button onClick={handleExportPDF} className="btn bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-500/30"><FileDown size={18} />匯出 PDF</button>
                      <button onClick={handleSaveAsNew} className="btn bg-white/10 hover:bg-white/20 text-white px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/5"><Save size={18} />另存為新食譜</button>
                      <button onClick={onClose} className="btn bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white px-10 h-12 rounded-xl font-bold shadow-lg shadow-orange-500/20">完成</button>
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
              <MobileLayout />
          </div>
          
          {/* 平板/電腦版顯示 DesktopLayout */}
          <div className="hidden md:block w-full max-w-6xl">
              <DesktopLayout />
          </div>
      </div>
    </>
  );
}