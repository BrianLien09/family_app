'use client';

import clsx from 'clsx';
import { Check, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { getRestockPrediction } from '@/lib/restock';
import { RestockItem } from '@/types';

interface RestockCardProps {
  item: RestockItem;
  onEdit: (item: RestockItem) => void;
  onDelete: (id: string) => void;
  onMarkPurchased: (id: string) => void;
  onAdjustStock: (id: string, adjustment: number) => void;
}

export default function RestockCard({
  item,
  onEdit,
  onDelete,
  onMarkPurchased,
  onAdjustStock,
}: RestockCardProps) {
  const prediction = getRestockPrediction(item);
  const hasInventory = item.currentStock !== undefined;
  const stock = item.currentStock ?? 0;
  const stockUnit = item.stockUnit ?? '個';
  const isLowStock = hasInventory
    && item.lowStockThreshold !== undefined
    && stock <= item.lowStockThreshold;
  const adjustment = item.restockAmount ?? 1;

  return (
    <article
      className={clsx(
        'flex flex-col gap-4 rounded-2xl border-2 bg-[#f0ece1] p-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
        isLowStock || prediction.isDue
          ? 'border-[#b87e6b]/55 shadow-[0_6px_18px_rgba(184,126,107,0.1)]'
          : 'border-dashed border-[#dcd0c2]',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-[#3d3a36]">{item.name}</h2>
          {isLowStock && (
            <span className="rounded-full bg-[#b87e6b]/15 px-2.5 py-1 text-xs font-bold text-[#b87e6b]">庫存不足</span>
          )}
          {!isLowStock && prediction.isDue && (
            <span className="rounded-full bg-[#b87e6b]/15 px-2.5 py-1 text-xs font-bold text-[#b87e6b]">該補貨了</span>
          )}
        </div>

        {hasInventory ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className={clsx('text-2xl font-bold tabular-nums', isLowStock ? 'text-[#b87e6b]' : 'text-[#3d3a36]')}>
              {stock} <span className="text-sm font-medium">{stockUnit}</span>
            </p>
            <p className="text-xs text-[#5f6368]">低於 {item.lowStockThreshold ?? 0} {stockUnit} 時提醒</p>
          </div>
        ) : (
          <button type="button" onClick={() => onEdit(item)} className="mt-2 text-sm font-medium text-[#5f7186] hover:text-[#b87e6b]">
            設定目前庫存
          </button>
        )}

        <p className="mt-2 text-xs text-[#5f6368]">
          {prediction.isDue ? '採買時間已到' : `預計 ${prediction.predictedDueDate}`} · 上次購買 {item.lastPurchasedOn}
        </p>
        {item.note && <p className="mt-1 line-clamp-1 text-xs text-[#5f6368]">{item.note}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 self-end sm:max-w-[220px] sm:justify-end sm:self-auto">
        {hasInventory && (
          <div className="flex items-center rounded-xl bg-[#e6e2d8] p-1">
            <button
              type="button"
              onClick={() => onAdjustStock(item.id, -adjustment)}
              className="rounded-lg p-2 text-[#5f6368] transition-colors hover:bg-[#dcd0c2]/60 hover:text-[#3d3a36]"
              aria-label={`減少 ${item.name} 庫存`}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => onAdjustStock(item.id, adjustment)}
              className="rounded-lg p-2 text-[#5f7186] transition-colors hover:bg-[#dcd0c2]/60"
              aria-label={`增加 ${item.name} 庫存`}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-xl p-2.5 text-[#5f6368] transition-colors hover:bg-[#e6e2d8] hover:text-[#3d3a36]"
          aria-label={`編輯 ${item.name}`}
          title="編輯"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-xl p-2.5 text-[#b87e6b] transition-colors hover:bg-[#b87e6b]/10"
          aria-label={`刪除 ${item.name}`}
          title="刪除"
        >
          <Trash2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => onMarkPurchased(item.id)}
          className="flex items-center gap-1.5 rounded-xl bg-[#5f7186] px-3 py-2.5 text-sm font-bold text-[#f0ece1] transition-colors hover:bg-[#4d6178]"
          aria-label={`記錄 ${item.name} 已補貨`}
        >
          <Check size={17} />
          補貨入庫
        </button>
      </div>
    </article>
  );
}
