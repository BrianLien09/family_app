"use client";

import { AnimatePresence } from 'motion/react';
import Modal from '@/components/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isBusy?: boolean;
  /** 破壞性操作（刪除）使用警示色，避免與一般「儲存」按鈕在視覺上混淆 */
  danger?: boolean;
}

export default function ConfirmDialog({ isOpen, title, description, confirmLabel, onConfirm, onClose, isBusy = false, danger = false }: ConfirmDialogProps) {
  // 確認卡片共用焦點與捲動管理，避免底層頁面仍可操作。
  // 外層 AnimatePresence 讓 Modal 在 isOpen 變 false 後仍能播放離場動畫
  return <AnimatePresence>
    {isOpen && <Modal title={title} onClose={onClose} size="compact" isBusy={isBusy} closeOnBackdrop
      footer={<>
        <button type="button" disabled={isBusy} onClick={onClose} className="modal-secondary">取消</button>
        <button type="button" disabled={isBusy} onClick={onConfirm} className={danger ? 'modal-primary modal-danger' : 'modal-primary'}>{confirmLabel}</button>
      </>}>
      <p className="break-words text-sm leading-7 text-[#5f6368]">{description}</p>
    </Modal>}
  </AnimatePresence>;
}
