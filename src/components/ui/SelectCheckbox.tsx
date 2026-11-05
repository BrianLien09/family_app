'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import { m } from 'motion/react';
import { SPRING_SOFT } from '@/lib/motion';

/**
 * 批次選取的視覺勾選框（純顯示）。
 * 語意（role="checkbox"、aria-checked）放在可點擊的卡片本體，這裡標記 aria-hidden 避免重複朗讀。
 */
export default function SelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200',
        checked ? 'border-[#5f7186] bg-[#5f7186]' : 'border-dashed border-[#78716c] bg-[#dcd0c2]/30',
      )}
    >
      {checked && (
        <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING_SOFT} className="flex">
          <Check size={16} className="text-[#f0ece1]" strokeWidth={3} />
        </m.span>
      )}
    </span>
  );
}
