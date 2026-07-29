'use client';

import clsx from 'clsx';
import { CheckSquare, Pencil, Square, Trash2 } from 'lucide-react';
import { getRestockPrediction } from '@/lib/restock';
import { RestockItem } from '@/types';

interface RestockCardProps {
  item: RestockItem;
  onEdit: (item: RestockItem) => void;
  onDelete: (id: string) => void;
  onMarkPurchased: (id: string) => void;
}

export default function RestockCard({
  item,
  onEdit,
  onDelete,
  onMarkPurchased,
}: RestockCardProps) {
  const prediction = getRestockPrediction(item);
  const recentHistory = item.purchaseHistory.slice(-3).reverse();

  return (
    <article
      className={clsx(
        'rounded-3xl border-2 p-5 transition-all duration-200',
        prediction.isDue
          ? 'border-[#b87e6b]/60 bg-[#f0ece1] shadow-[0_8px_24px_rgba(184,126,107,0.15)]'
          : 'border-dashed border-[#dcd0c2] bg-[#f0ece1]',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-[#3d3a36]">{item.name}</h3>
            <span
              className={clsx(
                'rounded-full px-2.5 py-1 text-xs font-bold',
                prediction.isDue
                  ? 'bg-[#b87e6b]/15 text-[#b87e6b]'
                  : 'bg-[#5f7186]/10 text-[#5f7186]',
              )}
            >
              {prediction.isDue ? '\u5f85\u88dc\u8ca8' : '\u5b58\u91cf\u7a69\u5b9a'}
            </span>
            {prediction.reminderAlreadySent && prediction.isDue && (
              <span className="rounded-full bg-[#dcd0c2]/70 px-2.5 py-1 text-xs font-medium text-[#5f6368]">
                {'\u672c\u8f2a\u5df2\u63d0\u9192'}
              </span>
            )}
          </div>

          <p className="text-sm leading-6 text-[#5f6368]">
            {`\u6700\u8fd1\u4e00\u6b21\u8cfc\u8cb7\uff1a${item.lastPurchasedOn} \u00b7 \u63a8\u7b97\u4e0b\u6b21\u88dc\u8ca8\uff1a${prediction.predictedDueDate}`}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#e6e2d8]/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#5f6368]">
                {'\u9810\u8a2d\u983b\u7387'}
              </p>
              <p className="mt-1 text-lg font-bold text-[#3d3a36]">{`${item.targetIntervalDays} \u5929`}</p>
            </div>
            <div className="rounded-2xl bg-[#e6e2d8]/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#5f6368]">
                {'\u667a\u6167\u983b\u7387'}
              </p>
              <p className="mt-1 text-lg font-bold text-[#3d3a36]">{`${prediction.effectiveIntervalDays} \u5929`}</p>
            </div>
            <div className="rounded-2xl bg-[#e6e2d8]/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#5f6368]">
                {'\u76ee\u524d\u72c0\u614b'}
              </p>
              <p className="mt-1 text-lg font-bold text-[#3d3a36]">
                {prediction.isDue
                  ? `\u5df2\u8d85\u904e ${Math.abs(prediction.daysUntilDue)} \u5929`
                  : `\u9084\u6709 ${prediction.daysUntilDue} \u5929`}
              </p>
            </div>
          </div>

          {item.note && (
            <p className="mt-3 rounded-2xl bg-[#e6e2d8]/70 px-4 py-3 text-sm leading-6 text-[#3d3a36]">
              {item.note}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#5f6368]">
            <span className="font-medium text-[#3d3a36]">{'\u6700\u8fd1\u7d00\u9304'}</span>
            {recentHistory.map((record) => (
              <span key={record.purchasedOn} className="rounded-full bg-[#dcd0c2]/60 px-2.5 py-1">
                {record.purchasedOn}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-[180px]">
          <button
            type="button"
            onClick={() => onMarkPurchased(item.id)}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
              prediction.isDue
                ? 'bg-[#5f7186] text-[#f0ece1] hover:bg-[#4d6178]'
                : 'bg-[#dcd0c2]/60 text-[#3d3a36] hover:bg-[#d0c4b5]',
            )}
            aria-label={`\u6a19\u8a18 ${item.name} \u5df2\u88dc\u8ca8`}
          >
            {prediction.isDue ? <Square size={18} /> : <CheckSquare size={18} />}
            {prediction.isDue ? '\u52fe\u9078\u5df2\u88dc\u8ca8' : '\u4eca\u5929\u518d\u88dc\u4e00\u6b21'}
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#e6e2d8] px-4 py-3 text-sm font-medium text-[#3d3a36] transition-all hover:bg-[#dcd0c2]/60"
            aria-label={`\u7de8\u8f2f ${item.name}`}
          >
            <Pencil size={16} />
            {'\u7de8\u8f2f'}
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#b87e6b]/12 px-4 py-3 text-sm font-medium text-[#b87e6b] transition-all hover:bg-[#b87e6b]/18"
            aria-label={`\u522a\u9664 ${item.name}`}
          >
            <Trash2 size={16} />
            {'\u522a\u9664'}
          </button>
        </div>
      </div>
    </article>
  );
}
