'use client';

import { useEffect, useId, useRef, type FormEventHandler, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { useModalViewport } from '@/hooks/useModalViewport';
import SaveButton from '@/components/SaveButton';

interface ModalProps {
  isOpen?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  size?: 'compact' | 'regular' | 'wide' | 'workspace';
  isBusy?: boolean;
  closeOnBackdrop?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export default function Modal({ isOpen = true, title, onClose, children, footer, headerActions,
  size = 'regular', isBusy = false, closeOnBackdrop = false, onSubmit }: ModalProps) {
  const titleId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const current = useRef({ onClose, isBusy });
  useEffect(() => { current.current = { onClose, isBusy }; }, [onClose, isBusy]);
  useImmersiveMode(isOpen);
  useModalViewport(viewportRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const panel = panelRef.current;
    // 手機不自動叫出鍵盤；桌面直接從第一個可填寫欄位開始。
    const firstInput = window.matchMedia('(min-width: 768px)').matches
      ? panel?.querySelector<HTMLElement>('input:not([type="range"]):not(:disabled), textarea:not(:disabled), select:not(:disabled)')
      : null;
    (firstInput ?? panel)?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!current.current.isBusy) current.current.onClose();
      }
      if (event.key !== 'Tab' || !panel) return;
      const targets = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      )).filter(element => !element.matches(':disabled') && element.getClientRects().length > 0);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;
  const close = () => { if (!current.current.isBusy) current.current.onClose(); };
  return createPortal(
    <div ref={viewportRef} className={`modal-viewport ${size === 'compact' ? 'modal-viewport-compact' : ''}`}>
      <div className="modal-backdrop" onClick={closeOnBackdrop ? close : undefined} aria-hidden="true" />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        aria-busy={isBusy} className={`modal-panel modal-${size}`}>
        <header className="modal-header">
          <h2 id={titleId} className="min-w-0 flex-1 break-words text-lg font-bold leading-snug sm:text-xl">{title}</h2>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <button type="button" disabled={isBusy} onClick={close} className="modal-icon-button" aria-label="關閉對話框"><X size={22} /></button>
          </div>
        </header>
        <form className="modal-form" onSubmit={onSubmit ?? (event => event.preventDefault())}>
          <div className="modal-body custom-scrollbar">{children}</div>
          {footer && <footer className="modal-footer">{footer}</footer>}
        </form>
      </div>
    </div>, document.body,
  );
}

interface ModalActionsProps {
  onClose: () => void;
  isSubmitting: boolean;
  children: ReactNode;
}

export function ModalActions({ onClose, isSubmitting, children }: ModalActionsProps) {
  return <>
    <button type="button" className="modal-secondary" disabled={isSubmitting} onClick={onClose}>取消</button>
    <SaveButton type="submit" isSubmitting={isSubmitting} className="modal-primary">{children}</SaveButton>
  </>;
}
