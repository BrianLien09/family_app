'use client';

import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { crossFade } from '@/lib/motion';

interface SaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting: boolean;
}

export default function SaveButton({ isSubmitting, disabled, children, ...props }: SaveButtonProps) {
  return (
    <button {...props} disabled={isSubmitting || disabled} aria-busy={isSubmitting}>
      <span className="inline-grid">
        {/* 兩層文字疊在同一格，按鈕寬度固定；用透明度交接而非 invisible，切換時才看得出狀態改變 */}
        <span
          aria-hidden={isSubmitting}
          className={clsx(
            'col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 transition-opacity duration-fast ease-out-expo',
            isSubmitting && 'opacity-0',
          )}
        >
          {children}
        </span>
        <AnimatePresence initial={false}>
          {isSubmitting && (
            <m.span key="saving" variants={crossFade} initial="hidden" animate="visible" exit="exit" className="col-start-1 row-start-1 text-center" role="status">
              儲存中…
            </m.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
