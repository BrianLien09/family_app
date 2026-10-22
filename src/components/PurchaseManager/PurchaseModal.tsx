'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Hash, Plus } from 'lucide-react';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';
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
const inputStyle = 'modal-input';

export default function PurchaseModal({ item, categories, choiceOptions, onClose, onSave }: PurchaseModalProps) {
  const { isSubmitting, submit, close } = useFormSubmission(onClose);
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [priceCny, setPriceCny] = useState(item?.priceCny?.toString() ?? '');
  // 已填人民幣的紀錄直接展開，零元也視為已填，避免編輯時隱藏既有資料。
  const [isCnyVisible, setIsCnyVisible] = useState(item?.priceCny != null);
  const cnyFieldId = useId();
  const cnyFocusTarget = useRef<'input' | 'button' | null>(null);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(() => onSave({ name: name.trim(), price: price.trim() ? Number(price) : null, priceCny: priceCny.trim() ? Number(priceCny) : null, category: selectedCategory, beneficiary, purchaser, date, platform: platform.trim(), note: note.trim(), memory: selectedCategory === '手機' ? memory?.trim() || null : null, storage: selectedCategory === '手機' ? storage?.trim() || null : null }));
  };

  return <Modal title={item ? '編輯購買紀錄' : '新增購買紀錄'} onClose={close} size="wide"
    isBusy={isSubmitting} closeOnBackdrop onSubmit={handleSubmit}
    footer={<ModalActions onClose={close} isSubmitting={isSubmitting}>{item ? '儲存修改' : '儲存紀錄'}</ModalActions>}>
        <fieldset disabled={isSubmitting} className="grid min-w-0 grid-cols-1 items-start gap-x-6 gap-y-5 md:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-3 text-sm font-bold leading-5"><span>品名／型號</span><input required maxLength={120} className={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="例如：iPhone、Galaxy 手機型號" /></label>
          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-bold leading-5">購買價格</legend>
            <div className="space-y-3">
              <label className="relative block min-w-0">
                <span className="sr-only">台幣 NT$</span><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">NT$</span>
                <input type="number" inputMode="decimal" required={!priceCny.trim()} min="0" max={Number.MAX_SAFE_INTEGER} step="0.01" className={`${inputStyle} pl-12`} value={price} onChange={e => setPrice(e.target.value)} placeholder="台幣金額" />
              </label>
              {!isCnyVisible ? <button type="button" className="modal-secondary w-full border-dashed"
                ref={element => { if (element && cnyFocusTarget.current === 'button') { cnyFocusTarget.current = null; element.focus(); } }}
                aria-expanded={false} aria-controls={cnyFieldId} onClick={() => { cnyFocusTarget.current = 'input'; setIsCnyVisible(true); }}>
                <Plus size={16} />填寫人民幣價格
              </button> : <div id={cnyFieldId} className="space-y-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <label htmlFor={`${cnyFieldId}-input`} className="text-sm font-medium">人民幣價格（選填）</label>
                  <button type="button" className="modal-secondary shrink-0" aria-label="移除人民幣價格"
                    onClick={() => { cnyFocusTarget.current = 'button'; setIsCnyVisible(false); setPriceCny(''); }}>移除</button>
                </div>
                <div className="relative min-w-0">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">¥</span>
                  <input id={`${cnyFieldId}-input`} ref={element => { if (element && cnyFocusTarget.current === 'input') { cnyFocusTarget.current = null; element.focus(); } }} type="number" inputMode="decimal" min="0" max={Number.MAX_SAFE_INTEGER} step="0.01" className={`${inputStyle} pl-8`} value={priceCny} onChange={e => setPriceCny(e.target.value)} placeholder="人民幣金額" />
                </div>
              </div>}
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
  </Modal>;
}
