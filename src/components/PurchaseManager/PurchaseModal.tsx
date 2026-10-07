'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Hash, Plus, X } from 'lucide-react';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import SaveButton from '@/components/SaveButton';
import PurchaseChoiceField from '@/components/PurchaseManager/PurchaseChoiceField';
import { FAMILY_MEMBERS, MEMBER_COLORS, FamilyMember } from '@/types';
import { getTodayDateString } from '@/lib/date';
import { PHONE_MEMORY, PHONE_STORAGE, PURCHASE_PLATFORMS, PurchaseItem, PurchaseInput } from '@/lib/purchases';

interface PurchaseModalProps {
  item: PurchaseItem | null;
  categories: string[];
  choiceOptions?: { platforms: string[]; memories: string[]; storages: string[] };
  onClose: () => void;
  onSave: (data: PurchaseInput) => Promise<boolean>;
}
const inputStyle = 'w-full min-w-0 rounded-xl border border-[#dcd0c2] bg-[#e6e2d8]/50 block min-h-12 px-4 py-3 text-sm font-normal text-[#3d3a36]';

export default function PurchaseModal({ item, categories, choiceOptions, onClose, onSave }: PurchaseModalProps) {
  useImmersiveMode(true);
  const { isSubmitting, submit, close } = useFormSubmission(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [priceCny, setPriceCny] = useState(item?.priceCny?.toString() ?? '');
  const [category, setCategory] = useState(item?.category ?? '手機');
  const [customCategory, setCustomCategory] = useState('');
  const [beneficiary, setBeneficiary] = useState<FamilyMember>(item?.beneficiary ?? '共同');
  const [purchaser, setPurchaser] = useState<FamilyMember>(item?.purchaser ?? '孔呆');
  const [date, setDate] = useState(item?.date ?? getTodayDateString());
  const [platform, setPlatform] = useState(item?.platform ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [memory, setMemory] = useState<PurchaseItem['memory']>(item ? item.memory : '8GB');
  const [storage, setStorage] = useState<PurchaseItem['storage']>(item ? item.storage : '256GB');
  const selectedCategory = category === '' ? customCategory.trim() : category;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const targets = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
      if (!targets?.length) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, [close]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(() => onSave({ name: name.trim(), price: price.trim() ? Number(price) : null, priceCny: priceCny.trim() ? Number(priceCny) : null, category: selectedCategory, beneficiary, purchaser, date, platform: platform.trim(), note: note.trim(), memory: selectedCategory === '手機' ? memory?.trim() || null : null, storage: selectedCategory === '手機' ? storage?.trim() || null : null }));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="purchase-title" aria-busy={isSubmitting}>
    <button className="absolute inset-0 cursor-default" onClick={close} disabled={isSubmitting} aria-label="關閉購買紀錄視窗" />
    <div ref={panelRef} className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] shadow-2xl motion-safe:animate-scale-in">
      <div className="flex shrink-0 items-center justify-between border-b border-dashed border-[#dcd0c2] px-6 py-4">
        <h2 id="purchase-title" className="text-xl font-bold">{item ? '編輯購買紀錄' : '新增購買紀錄'}</h2>
        <button onClick={close} disabled={isSubmitting} className="rounded-lg p-2 hover:bg-[#e6e2d8]" aria-label="關閉"><X size={20} /></button>
      </div>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <fieldset disabled={isSubmitting} className="grid min-w-0 grid-cols-1 items-start gap-x-8 gap-y-6 p-6 sm:p-8 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-3 text-sm font-bold leading-5"><span>品名／型號</span><input autoFocus required maxLength={120} className={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="例如：iPhone、Galaxy 手機型號" /></label>
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-bold leading-5">購買價格</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="relative block min-w-0">
                <span className="sr-only">台幣 NT$</span><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">NT$</span>
                <input type="number" inputMode="decimal" required={!priceCny.trim()} min="0" max={Number.MAX_SAFE_INTEGER} step="0.01" className={`${inputStyle} pl-12`} value={price} onChange={e => setPrice(e.target.value)} placeholder="台幣金額" />
              </label>
              <label className="relative block min-w-0">
                <span className="sr-only">人民幣 ¥</span><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">¥</span>
                <input type="number" inputMode="decimal" required={!price.trim()} min="0" max={Number.MAX_SAFE_INTEGER} step="0.01" className={`${inputStyle} pl-8`} value={priceCny} onChange={e => setPriceCny(e.target.value)} placeholder="人民幣金額" />
              </label>
            </div>
          </fieldset>
          <fieldset className="min-w-0 md:col-span-2">
            <legend className="mb-3 flex items-center gap-2 text-sm font-bold leading-5"><Hash size={16} />選擇分類</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`max-w-full break-words min-h-12 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${category === value ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]' : 'border-[#dcd0c2] hover:bg-[#e6e2d8]'}`}>{value}</button>)}
              <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')} className={`flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-semibold transition-colors ${category === '' ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]' : 'border-[#dcd0c2] hover:bg-[#e6e2d8]'}`}><Plus size={16} />新增</button>
            </div>
          </fieldset>
          {category === '' && <label className="flex min-w-0 flex-col gap-3 text-sm font-bold leading-5 md:col-span-2"><span>自訂分類名稱</span><input required maxLength={30} className={inputStyle} value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="例如：攝影器材" /></label>}
          {selectedCategory === '手機' && <>
            <PurchaseChoiceField isFullWidth={false} isRequired={false} label="記憶體" options={choiceOptions?.memories ?? PHONE_MEMORY} value={memory ?? ''} onChange={setMemory} placeholder="例如：24GB" maxLength={30} />
            <PurchaseChoiceField isFullWidth={false} isRequired={false} label="儲存空間" options={choiceOptions?.storages ?? PHONE_STORAGE} value={storage ?? ''} onChange={setStorage} placeholder="例如：2TB" maxLength={30} />
          </>}
          {[
            { label: '使用對象', value: beneficiary, onSelect: setBeneficiary },
            { label: '購買人', value: purchaser, onSelect: setPurchaser },
          ].map(group => <fieldset key={group.label} className="min-w-0">
            <legend className="mb-3 text-sm font-bold leading-5">{group.label}</legend>
            <div className="flex flex-wrap gap-2">
              {FAMILY_MEMBERS.map(value => <button key={value} type="button" aria-pressed={group.value === value} onClick={() => group.onSelect(value)} className={`min-h-12 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${group.value === value ? 'text-[#f0ece1]' : 'bg-[#e6e2d8]/80 hover:bg-[#dcd0c2]/70'}`} style={{ backgroundColor: group.value === value ? MEMBER_COLORS[value] : undefined }}>{value}</button>)}
            </div>
          </fieldset>)}
          <label className="flex min-w-0 flex-col gap-3 text-sm font-bold leading-5"><span>購買日期</span><input type="date" required className={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></label>
          <PurchaseChoiceField isFullWidth={false} label="購買平台" options={choiceOptions?.platforms ?? PURCHASE_PLATFORMS} value={platform} onChange={setPlatform} placeholder="例如：PChome、品牌門市" maxLength={80} />
          <label className="flex min-w-0 flex-col gap-3 text-sm font-bold leading-5 md:col-span-2"><span>備註</span><textarea rows={2} maxLength={2000} className={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="保固、訂單編號或其他購買資訊" /></label>
        </fieldset>
        </div>
        <div className="shrink-0 border-t border-dashed border-[#dcd0c2] px-6 py-4"><SaveButton type="submit" isSubmitting={isSubmitting} className="btn-primary w-full py-3">{item ? '儲存修改' : '儲存紀錄'}</SaveButton></div>
      </form>
    </div>
  </div>, document.body);
}
