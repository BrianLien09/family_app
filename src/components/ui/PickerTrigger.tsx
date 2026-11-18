'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface PickerTriggerProps {
  label: string;
  icon: ReactNode;
  /** 已選取的值；空字串時顯示 placeholder */
  value: ReactNode;
  placeholder?: string;
  /** 值右側的輔助標籤，例如「今天」 */
  hint?: ReactNode;
  isOpen: boolean;
  panelId: string;
  onClick: () => void;
}

/**
 * 日期、時間選擇器共用的觸發按鈕。
 * 為什麼不用原生 input：原生 date／time 在 iOS、Android、桌面各長得不一樣，
 * 字級與大地色系也無法統一；改成按鈕＋展開面板，外觀與 44px 觸控高度都由我們掌控。
 * 手機上時間欄位會兩個並排、各只剩半寬，所以窄螢幕縮小間距與圖示。
 */
export default function PickerTrigger({ label, icon, value, placeholder = '未設定', hint, isOpen, panelId, onClick }: PickerTriggerProps) {
  const isEmpty = value === '' || value === null || value === undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={clsx(
        'group flex min-h-14 w-full min-w-0 items-center gap-2 rounded-xl border-2 border-dashed px-2.5 py-2 sm:gap-3 sm:px-3 text-left transition-colors duration-fast ease-out-expo',
        isOpen
          ? 'border-[#b87e6b] bg-[#f0ece1] ring-2 ring-[#b87e6b]/20'
          : 'border-[#dcd0c2]/70 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/40',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center sm:h-9 sm:w-9 justify-center rounded-lg transition-colors duration-fast ease-out-expo',
          isOpen ? 'bg-[#b87e6b] text-[#f0ece1]' : 'bg-[#5f7186]/10 text-[#5f7186]',
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium text-[#5f6368]">{label}</span>
        <span className={clsx('truncate text-base font-bold tabular-nums', isEmpty ? 'text-[#78716c]/70' : 'text-[#3d3a36]')}>
          {isEmpty ? placeholder : value}
        </span>
      </span>
      {hint}
      <ChevronDown
        size={18}
        aria-hidden="true"
        className={clsx('shrink-0 text-[#5f6368] transition-transform duration-base ease-out-expo', isOpen && 'rotate-180')}
      />
    </button>
  );
}
