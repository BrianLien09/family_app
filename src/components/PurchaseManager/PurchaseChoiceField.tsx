'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface PurchaseChoiceFieldProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  isFullWidth?: boolean;
  isRequired?: boolean;
}

export default function PurchaseChoiceField({ label, options, value, onChange, placeholder, maxLength, isFullWidth = true, isRequired = true }: PurchaseChoiceFieldProps) {
  const [isCustom, setIsCustom] = useState(Boolean(value && !options.includes(value)));

  return <fieldset className={`min-w-0 ${isFullWidth ? 'md:col-span-2' : ''}`}>
    <legend className="mb-3 text-sm font-bold leading-5">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {!isRequired && <button type="button" aria-pressed={!isCustom && !value} onClick={() => { setIsCustom(false); onChange(''); }} className={`min-h-12 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${!isCustom && !value ? 'bg-[#5f7186] text-[#f0ece1]' : 'bg-[#e6e2d8]/80 hover:bg-[#dcd0c2]/70'}`}>未提供</button>}
      {options.map(option => <button key={option} type="button" aria-pressed={!isCustom && value === option} onClick={() => { setIsCustom(false); onChange(option); }} className={`max-w-full break-words min-h-12 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${!isCustom && value === option ? 'bg-[#5f7186] text-[#f0ece1]' : 'bg-[#e6e2d8]/80 hover:bg-[#dcd0c2]/70'}`}>{option}</button>)}
      <button type="button" aria-label={`新增${label}`} aria-pressed={isCustom} onClick={() => { if (!isCustom) { setIsCustom(true); onChange(''); } }} className={`flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-semibold transition-colors ${isCustom ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]' : 'border-[#dcd0c2] hover:bg-[#e6e2d8]'}`}><Plus size={16} />新增</button>
    </div>
    {isCustom && <label className="mt-4 flex flex-col gap-3 text-sm font-bold leading-5"><span>自訂{label}內容</span><input required={isRequired} maxLength={maxLength} className="w-full min-w-0 rounded-xl border border-[#dcd0c2] bg-[#e6e2d8]/50 px-4 py-3 text-sm font-normal" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>}
  </fieldset>;
}
