'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <button type="button" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" onClick={onClose} aria-label="關閉確認視窗" />
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] p-6 shadow-[0_20px_50px_rgba(61,58,54,0.2)] animate-scale-in">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-[#5f6368] transition-colors hover:bg-[#e6e2d8] hover:text-[#b87e6b]" aria-label="關閉確認視窗">
          <X size={18} />
        </button>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b87e6b]/15 text-[#b87e6b]">
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-dialog-title" className="pr-8 text-xl font-bold text-[#3d3a36]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#3d3a36] transition-colors hover:bg-[#e6e2d8]">取消</button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-[#b87e6b] px-4 py-2.5 text-sm font-bold text-[#f0ece1] shadow-[0_4px_12px_rgba(184,126,107,0.2)] transition-colors hover:bg-[#a66a58]">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
