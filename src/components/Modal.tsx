'use client';

import { useEffect, useId, useRef, type FormEventHandler, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { m, useIsPresent, type Variants } from 'motion/react';
import { DURATION, EASE_IN, EASE_OUT } from '@/lib/motion';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { useModalViewport } from '@/hooks/useModalViewport';
import SaveButton from '@/components/SaveButton';

// 背景只淡入淡出；面板由下往上浮出（手機像底部面板，桌面則是輕微上浮），離場更短以免讓人等待
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_IN } },
};
const panelVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.slow, ease: EASE_OUT } },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE_IN } },
};

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
  // 離場動畫播放期間視為已關閉：忽略鍵盤與點擊，避免使用者對正在消失的彈窗重複操作
  const isPresent = useIsPresent();
  const current = useRef({ onClose, isBusy, isPresent });
  useEffect(() => { current.current = { onClose, isBusy, isPresent }; }, [onClose, isBusy, isPresent]);
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
      if (event.isComposing || event.defaultPrevented || !current.current.isPresent) return;
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
  const close = () => { if (!current.current.isBusy && current.current.isPresent) current.current.onClose(); };
  return createPortal(
    <div ref={viewportRef} className={`modal-viewport ${size === 'compact' ? 'modal-viewport-compact' : ''}`}
      style={{ pointerEvents: isPresent ? undefined : 'none' }}>
      <m.div className="modal-backdrop" variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        onClick={closeOnBackdrop ? close : undefined} aria-hidden="true" />
      <m.div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        aria-busy={isBusy} className={`modal-panel modal-${size}`}
        variants={panelVariants} initial="hidden" animate="visible" exit="exit">
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
      </m.div>
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
