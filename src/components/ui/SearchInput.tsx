'use client';

import clsx from 'clsx';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  'aria-label': string;
  className?: string;
}

/** 搜尋框：左側圖示、右側清除鈕；文字色固定深色，避免淺底淺字看不見 */
export default function SearchInput({ value, onChange, placeholder, className, 'aria-label': ariaLabel }: SearchInputProps) {
  return (
    <div className={clsx('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]" size={18} aria-hidden="true" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={event => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border-2 border-dashed border-[#dcd0c2]/70 bg-[#dcd0c2]/30 py-2.5 pl-10 pr-11 text-sm text-[#3d3a36] transition-colors duration-200 placeholder:text-[#78716c]/70 hover:bg-[#dcd0c2]/40 focus:border-[#b87e6b] focus:bg-[#f0ece1]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="清除搜尋"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#5f6368] transition-colors hover:text-[#b87e6b]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
