'use client';

import { useState, useMemo, useRef } from 'react';
import { Recipe } from '@/types';
import { Minus, Plus, Edit, Trash2, FileDown } from 'lucide-react';
import Modal from '@/components/Modal';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import SaveButton from '@/components/SaveButton';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface RecipeCalculatorProps {
  recipe: Recipe;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAdd: (recipe: Recipe) => Promise<boolean>;
  onEdit: () => void;
}

type ScaleMode = 'servings' | 'ingredient';

export default function RecipeCalculator({ recipe, onClose, onDelete, onAdd, onEdit }: RecipeCalculatorProps) {
  const { isSubmitting, submit, close } = useFormSubmission(onClose);
  const [mode, setMode] = useState<ScaleMode>('servings');
  const [scale, setScale] = useState(1);
  const [customServings, setCustomServings] = useState(recipe.baseServings);
  const [refIngredientId, setRefIngredientId] = useState(recipe.ingredients[0]?.id || '');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const pdfContentRef = useRef<HTMLDivElement>(null); // PDF 內容容器

  const [isExporting, setIsExporting] = useState(false);
  const exportPending = useRef(false);

  const handleServingsChange = (newServings: number) => {
    if (!Number.isFinite(newServings) || newServings < 0.1) return;
    setCustomServings(newServings);
    setScale(newServings / recipe.baseServings);
  };

  const currentRefIngredient = useMemo(() => 
    recipe.ingredients.find(i => i.id === refIngredientId), 
  [recipe.ingredients, refIngredientId]);

  // 輸入失效時不沿用上一組換算結果，確保顯示、另存與匯出屬於同一次輸入。
  const hasValidScale = Number.isFinite(scale) && scale > 0 && Number.isFinite(customServings) && customServings > 0
    && (mode === 'servings' || (targetAmount.trim() !== '' && Number.isFinite(Number(targetAmount))
      && Number(targetAmount) > 0 && Boolean(currentRefIngredient && currentRefIngredient.amount > 0)));

  const handleIngredientScale = (val: string) => {
    setTargetAmount(val);
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num <= 0 || !currentRefIngredient || currentRefIngredient.amount === 0) return;
    
    const newScale = num / currentRefIngredient.amount;
    setScale(newScale);
    // 儲存保留實際份數，避免極小份量四捨五入成零而使下次換算除以零。
    setCustomServings(recipe.baseServings * newScale);
  };

  const handleSaveAsNew = async () => {
    if (!hasValidScale) return;
    const newTitle = `${recipe.title} (${customServings}人份)`;
    const newIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      amount: Number((ing.amount * scale).toPrecision(6))
    }));

    await submit(() => onAdd({
      id: Date.now().toString(),
      title: newTitle,
      description: `由 ${recipe.title} 依比例調整而來`,
      baseServings: customServings,
      ingredients: newIngredients,
      cookingTime: recipe.cookingTime ?? null,
    }));
  };

  const formatAmount = (num: number) => {
    if (num > 0 && num < 0.1) return Number(num.toPrecision(6)).toString();
    return parseFloat(num.toFixed(1)).toString();
  };
  
  /**
   * 匯出 PDF - 使用 html2canvas 轉換 HTML 為圖片後生成 PDF
   * 完美支援中文顯示
   */
  const handleExportPDF = async () => {
    if (!pdfContentRef.current || exportPending.current || !hasValidScale) return;
    exportPending.current = true;
    setIsExporting(true);

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
      toast.error('匯出失敗，請稍後再試');
    } finally {
      exportPending.current = false;
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* 📄 隱藏的 PDF 內容區域 (用於 html2canvas 捕獲) */}
      <div 
        ref={pdfContentRef}
        aria-hidden="true"
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
            <span>🔢 縮放倍率: <strong>{scale < 0.01 ? formatAmount(scale) : scale.toFixed(2)}x</strong></span>
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

      <Modal title={recipe.title} onClose={close} size="workspace" isBusy={isSubmitting || isExporting}
        headerActions={<>
          <button type="button" disabled={isSubmitting || isExporting} onClick={onEdit} className="modal-icon-button" aria-label="編輯食譜"><Edit size={20} /></button>
          <button type="button" disabled={isSubmitting || isExporting} onClick={() => onDelete(recipe.id)} className="modal-icon-button" aria-label="刪除食譜"><Trash2 size={20} /></button>
        </>}
        footer={<>
          <button type="button" disabled={isSubmitting || isExporting} onClick={close} className="modal-secondary">關閉</button>
          <button type="button" disabled={isSubmitting || isExporting || !hasValidScale} onClick={handleExportPDF} className="modal-secondary"><FileDown size={18} />{isExporting ? '匯出中…' : 'PDF'}</button>
          <SaveButton type="button" disabled={isExporting || !hasValidScale} isSubmitting={isSubmitting} onClick={handleSaveAsNew} className="modal-primary">另存新食譜</SaveButton>
        </>}>
        <fieldset disabled={isSubmitting || isExporting} className="grid min-w-0 grid-cols-1 items-start gap-6 border-0 p-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="min-w-0 space-y-5">
            <h3 className="text-sm font-bold">份量換算</h3>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="換算方式">
              <button type="button" className="modal-choice" aria-pressed={mode === 'servings'} onClick={() => setMode('servings')}>依份量調整</button>
              <button type="button" className="modal-choice" aria-pressed={mode === 'ingredient'} onClick={() => setMode('ingredient')}>依食材反推</button>
            </div>
            {mode === 'servings' ? <div key="servings-view" className="space-y-4">
              <label className="modal-field" htmlFor="target-servings">製作份數</label>
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" className="modal-icon-button" aria-label="減少半份" onClick={() => handleServingsChange(customServings - 0.5)}><Minus size={20} /></button>
                <input id="target-servings" className="modal-input text-center" type="number" inputMode="decimal" min="0.1" step="any" value={customServings} onChange={e => handleServingsChange(Number(e.target.value))} />
                <button type="button" className="modal-icon-button" aria-label="增加半份" onClick={() => handleServingsChange(customServings + 0.5)}><Plus size={20} /></button>
              </div>
              <input aria-label="調整製作份數" className="min-h-11 w-full accent-[#b87e6b]" type="range" min="0.1" max={Math.max(10, recipe.baseServings * 3, customServings)} step="0.1" value={customServings} onChange={e => handleServingsChange(Number(e.target.value))} />
            </div> : <div key="ingredient-view" className="space-y-4">
              <label className="modal-field">已知食材<select className="modal-input" value={refIngredientId} onChange={e => { setRefIngredientId(e.target.value); setTargetAmount(''); }}>
                {recipe.ingredients.map(ingredient => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}（原 {ingredient.amount} {ingredient.unit}）</option>)}
              </select></label>
              <label className="modal-field">現有重量（{currentRefIngredient?.unit}）<input className="modal-input" type="number" inputMode="decimal" min={Number.MIN_VALUE} step="any" aria-invalid={Boolean(targetAmount) && !hasValidScale} aria-describedby={!hasValidScale ? 'scale-feedback' : undefined} placeholder="例如：150" value={targetAmount} onChange={e => handleIngredientScale(e.target.value)} /></label>
            </div>}
            <p id="scale-feedback" className="rounded-xl bg-[#dcd0c2]/30 p-4 text-sm leading-7" aria-live="polite">{hasValidScale
              ? <>製作 {formatAmount(customServings)} 人份 · 原食譜的 {scale < 0.01 ? formatAmount(scale) : scale.toFixed(2)} 倍</>
              : '請輸入大於 0 的重量，並確認原食材用量大於 0。'}</p>
            {recipe.cookingTime && <p className="text-sm leading-7 text-[#5f6368]">烹飪設定：{recipe.cookingTime.value}{recipe.cookingTime.unit}／{recipe.cookingTime.minutes} 分鐘</p>}
            {recipe.description && <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#5f6368]">{recipe.description}</p>}
          </div>
          <section className="min-w-0 space-y-3" aria-labelledby="calculator-ingredients">
            <h3 id="calculator-ingredients" className="text-sm font-bold">所需食材</h3>
            {!hasValidScale && <p className="text-sm leading-7 text-[#5f6368]">填寫有效重量後顯示換算結果。</p>}
            {hasValidScale && recipe.ingredients.map(ingredient => <div key={ingredient.id} className={`flex min-w-0 flex-wrap items-baseline justify-between gap-3 rounded-xl border p-4 ${mode === 'ingredient' && ingredient.id === refIngredientId ? 'border-[#5f7186]/50 bg-[#5f7186]/10' : 'border-[#dcd0c2]/70'}`}>
              <span className="min-w-0 break-words font-medium">{ingredient.name}</span>
              <span className="ml-auto break-words text-right font-semibold tabular-nums text-[#5f7186]">{formatAmount(ingredient.amount * scale)} {ingredient.unit}</span>
            </div>)}
          </section>
        </fieldset>
      </Modal>
    </>
  );
}
