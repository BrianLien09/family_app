'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { RestockItem } from '@/types';
import { getTodayDateString, normalizePurchaseHistory } from '@/lib/restock';

interface AddRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<RestockItem, 'id'>) => void;
  initialData?: RestockItem | null;
}

export default function AddRestockModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AddRestockModalProps) {
  useImmersiveMode(isOpen);

  const [name, setName] = useState(() => initialData?.name ?? '');
  const [currentStock, setCurrentStock] = useState(() => String(initialData?.currentStock ?? 0));
  const [stockUnit, setStockUnit] = useState(() => initialData?.stockUnit ?? '個');
  const [lowStockThreshold, setLowStockThreshold] = useState(() => String(initialData?.lowStockThreshold ?? 0));
  const [restockAmount, setRestockAmount] = useState(() => String(initialData?.restockAmount ?? 1));
  const [targetIntervalDays, setTargetIntervalDays] = useState(() => String(initialData?.targetIntervalDays ?? 30));
  const [lastPurchasedOn, setLastPurchasedOn] = useState(() => initialData?.lastPurchasedOn ?? getTodayDateString());
  const [note, setNote] = useState(() => initialData?.note ?? '');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const interval = Number(targetIntervalDays);
    const stock = Number(currentStock);
    const threshold = Number(lowStockThreshold);
    const amount = Number(restockAmount);
    const normalizedUnit = stockUnit.trim();

    if (
      !normalizedName
      || !normalizedUnit
      || !Number.isFinite(interval)
      || interval < 1
      || !Number.isFinite(stock)
      || stock < 0
      || !Number.isFinite(threshold)
      || threshold < 0
      || !Number.isFinite(amount)
      || amount <= 0
    ) {
      return;
    }

    onSubmit({
      name: normalizedName,
      currentStock: stock,
      stockUnit: normalizedUnit,
      lowStockThreshold: threshold,
      restockAmount: amount,
      targetIntervalDays: Math.round(interval),
      lastPurchasedOn,
      purchaseHistory: initialData
        ? normalizePurchaseHistory(initialData.purchaseHistory, initialData.lastPurchasedOn)
        : [{ purchasedOn: lastPurchasedOn }],
      lastNotifiedDueOn: initialData?.lastNotifiedDueOn ?? '',
      note: note.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label={'\u95dc\u9589\u88dc\u8ca8\u9805\u76ee\u8996\u7a97'}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-dashed border-[#dcd0c2]/80 px-5 py-3">
          <div>
            <h2 id="restock-modal-title" className="text-lg font-bold text-[#3d3a36]">
              {initialData ? '編輯庫存項目' : '新增庫存項目'}
            </h2>
            <p className="text-xs text-[#5f6368]">
              設定庫存與補貨量，之後可直接從清單更新數量。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#3d3a36] transition-all duration-200 hover:bg-[#dcd0c2]/50 hover:text-[#b87e6b]"
            aria-label={'\u95dc\u9589'}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 overflow-y-auto p-4 sm:overflow-y-visible sm:p-5">
          <div className="space-y-1">
            <label htmlFor="restock-name" className="block text-sm font-medium text-[#3d3a36]">
              {'\u7269\u54c1\u540d\u7a31'}
            </label>
            <input
              id="restock-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] placeholder:text-[#78716c] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
              placeholder={'\u4f8b\u5982\uff1a\u885b\u751f\u7d19\u3001\u725b\u5976\u3001\u6d17\u7897\u7cbe'}
              autoFocus
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-1">
              <label htmlFor="restock-stock" className="block text-sm font-medium text-[#3d3a36]">
                目前庫存
              </label>
              <input
                id="restock-stock"
                type="number"
                min="0"
                step="0.1"
                value={currentStock}
                onChange={(event) => setCurrentStock(event.target.value)}
                className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="restock-unit" className="block text-sm font-medium text-[#3d3a36]">
                單位
              </label>
              <input
                id="restock-unit"
                type="text"
                value={stockUnit}
                onChange={(event) => setStockUnit(event.target.value)}
                className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                placeholder="捲"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="restock-threshold" className="block text-sm font-medium text-[#3d3a36]">
                低庫存提醒
              </label>
              <input
                id="restock-threshold"
                type="number"
                min="0"
                step="0.1"
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(event.target.value)}
                className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="restock-amount" className="block text-sm font-medium text-[#3d3a36]">
                每次補貨量
              </label>
              <input
                id="restock-amount"
                type="number"
                min="0.1"
                step="0.1"
                value={restockAmount}
                onChange={(event) => setRestockAmount(event.target.value)}
                className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="restock-interval" className="block text-sm font-medium text-[#3d3a36]">
                {'\u9810\u8a2d\u983b\u7387'}
              </label>
              <div className="relative">
                <input
                  id="restock-interval"
                  type="number"
                  min="1"
                  step="1"
                  value={targetIntervalDays}
                  onChange={(event) => setTargetIntervalDays(event.target.value)}
                  className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 pr-14 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                  required
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#5f6368]">
                  {'\u5929'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="restock-purchased-on" className="block text-sm font-medium text-[#3d3a36]">
                {'\u6700\u8fd1\u4e00\u6b21\u8cfc\u8cb7\u65e5'}
              </label>
              <input
                id="restock-purchased-on"
                type="date"
                value={lastPurchasedOn}
                onChange={(event) => setLastPurchasedOn(event.target.value)}
                className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30"
                required
                disabled={Boolean(initialData)}
              />
            </div>
          </div>

          {initialData && (
            <div className="rounded-2xl border border-[#dcd0c2] bg-[#e6e2d8]/70 p-3 text-xs text-[#5f6368]">
              <div className="mb-1 flex items-center gap-2 font-medium text-[#3d3a36]">
                <RotateCcw size={16} />
                {'\u6b77\u53f2\u8cfc\u8cb7\u6703\u4fdd\u7559'}
              </div>
              <p>
                {`\u76ee\u524d\u6700\u5f8c\u4e00\u6b21\u8cfc\u8cb7\u65e5\u662f ${initialData.lastPurchasedOn}\u3002\u4e4b\u5f8c\u8acb\u76f4\u63a5\u7528\u5361\u7247\u4e0a\u7684\u300c\u5df2\u88dc\u8ca8\u300d\u6838\u53d6\u6846\u8a18\u9304\u65b0\u4e00\u6b21\u88dc\u8ca8\u3002`}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="restock-note" className="block text-sm font-medium text-[#3d3a36]">
              {'\u5099\u8a3b'}
            </label>
            <textarea
              id="restock-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-16 w-full resize-none overflow-y-auto rounded-xl border-2 border-dashed border-[#dcd0c2] bg-[#e6e2d8] px-4 py-2.5 text-[#3d3a36] placeholder:text-[#78716c] [scrollbar-width:none] focus:outline-none focus:ring-2 focus:ring-[#b87e6b]/30 sm:h-10 [&::-webkit-scrollbar]:hidden"
              placeholder={'\u4f8b\u5982\uff1a\u56fa\u5b9a\u8cb7\u4e09\u4e32\u3001\u5feb\u898b\u5e95\u6642\u6703\u5148\u6253\u958b\u5099\u54c1'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[#3d3a36] transition-all duration-200 hover:bg-[#dcd0c2]/40 hover:text-[#b87e6b]"
            >
              {'\u53d6\u6d88'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#b87e6b] px-5 py-2.5 text-sm font-bold text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] transition-all active:scale-[0.98] hover:bg-[#a66a58]"
            >
              <Check size={16} />
              {initialData ? '儲存修改' : '加入庫存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
