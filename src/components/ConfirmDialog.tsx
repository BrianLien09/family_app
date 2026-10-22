"use client";

import Modal from '@/components/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isBusy?: boolean;
}

export default function ConfirmDialog({ isOpen, title, description, confirmLabel, onConfirm, onClose, isBusy = false }: ConfirmDialogProps) {
  // 確認卡片共用焦點與捲動管理，避免底層頁面仍可操作。
  return <Modal isOpen={isOpen} title={title} onClose={onClose} size="compact" isBusy={isBusy} closeOnBackdrop
    footer={<>
      <button type="button" disabled={isBusy} onClick={onClose} className="modal-secondary">取消</button>
      <button type="button" disabled={isBusy} onClick={onConfirm} className="modal-primary">{confirmLabel}</button>
    </>}>
    <p className="break-words text-sm leading-7 text-[#5f6368]">{description}</p>
  </Modal>;
}
