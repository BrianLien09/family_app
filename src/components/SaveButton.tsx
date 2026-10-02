'use client';

import type { ButtonHTMLAttributes } from 'react';

interface SaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting: boolean;
}

export default function SaveButton({ isSubmitting, disabled, children, ...props }: SaveButtonProps) {
  return (
    <button {...props} disabled={isSubmitting || disabled} aria-busy={isSubmitting}>
      <span className="inline-grid">
        <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 ${isSubmitting ? 'invisible' : ''}`}>
          {children}
        </span>
        {isSubmitting && <span className="col-start-1 row-start-1 text-center" role="status">儲存中…</span>}
      </span>
    </button>
  );
}
