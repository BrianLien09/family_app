'use client';

import { DateItem } from '@/types';
import { Trash2, Clock, Tag, Edit } from 'lucide-react';
import { m } from 'motion/react';
import clsx from 'clsx';
import { CategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';
import IconButton from '@/components/ui/IconButton';
import SelectCheckbox from '@/components/ui/SelectCheckbox';
import { listItem } from '@/lib/motion';

interface DateCardProps {
  item: DateItem;
  onDelete: (id: string) => void;
  onEdit: () => void;
  batchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  categoryColors: CategoryColorMap;
}

export default function DateCard({ item, onDelete, onEdit, batchMode = false, isSelected = false, onToggleSelect, categoryColors }: DateCardProps) {
  const dateObj = new Date(item.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 三天內視為緊急
  const isUrgent = diffDays >= 0 && diffDays <= 3;
  const categoryStyles = getCategoryColorStyles(item.category, categoryColors);

  let daysText = '';
  if (diffDays < 0) daysText = '已結束';
  else if (diffDays === 0) daysText = '今天';
  else if (diffDays === 1) daysText = '明天';
  else daysText = `${diffDays} 天後`;

  return (
    <m.div
      layout="position"
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      // 只對 transform 做 hover 位移；移除 backdrop-blur 與常駐 will-change，長清單才不會累積合成層
      whileHover={batchMode ? undefined : { y: -2 }}
      role={batchMode ? 'checkbox' : undefined}
      aria-checked={batchMode ? isSelected : undefined}
      tabIndex={batchMode ? 0 : undefined}
      onKeyDown={batchMode ? event => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          onToggleSelect?.(item.id);
        }
      } : undefined}
      className={clsx(
        'group relative flex items-start gap-3 rounded-lg border-2 border-dashed p-3 transition-colors duration-200',
        batchMode && 'cursor-pointer',
        isSelected
          ? 'border-[#5f7186]/60 bg-[#5f7186]/10'
          : 'border-[#dcd0c2]/50 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50',
      )}
      onClick={() => batchMode && onToggleSelect?.(item.id)}
    >
      {batchMode ? (
        <span className="mt-0.5"><SelectCheckbox checked={isSelected} /></span>
      ) : (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={categoryStyles.dot} />
      )}

      {/* 非批次模式在右側預留操作鈕空間，避免標題與標籤被按鈕蓋住 */}
      <div className={clsx('min-w-0 flex-1', !batchMode && 'md:group-hover:pr-24 md:group-focus-within:pr-24')}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-lg font-bold tracking-wide text-[#3d3a36]">{item.title}</h3>
          {isUrgent && (
            <span className="shrink-0 rounded bg-[#b87e6b] px-2 py-0.5 text-[10px] font-bold text-[#f0ece1]">
              緊急
            </span>
          )}
        </div>

        {/* flex-wrap：空間不夠時標籤自動換行 */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#5f7186]/10 px-2 py-0.5 text-sm font-medium text-[#5f7186]">
            <Clock size={14} />
            {item.date}
            {item.startTime && (
              <span className="ml-0.5 border-l border-[#5f7186]/30 pl-1.5">
                {item.startTime}
                {item.endTime && ` ~ ${item.endTime}`}
              </span>
            )}
          </span>

          <span className={clsx(
            'whitespace-nowrap rounded-md border-2 border-dashed px-2 py-0.5 text-sm font-medium',
            isUrgent
              ? 'border-[#b87e6b]/20 bg-[#b87e6b]/10 text-[#b87e6b]'
              : 'border-[#dcd0c2]/50 bg-[#dcd0c2]/30 text-[#3d3a36]',
          )}>
            {daysText}
          </span>

          <span
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed px-2 py-0.5 text-sm font-medium"
            style={categoryStyles.badge}
          >
            <Tag size={14} />
            {item.category}
          </span>
        </div>

        {item.description && (
          <p className="mt-2 line-clamp-2 border-l-2 border-[#dcd0c2] pl-2 text-sm text-[#3d3a36]">
            {item.description}
          </p>
        )}
      </div>

      {/* 桌面版：hover 或鍵盤聚焦才顯示；手機版常駐（沒有 hover），且維持 44px 觸控面積 */}
      {!batchMode && (
        <div className="flex shrink-0 gap-1 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <IconButton tone="accent" aria-label={`編輯 ${item.title}`} onClick={onEdit}>
            <Edit size={16} />
          </IconButton>
          <IconButton tone="danger" aria-label={`刪除 ${item.title}`} onClick={() => onDelete(item.id)}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      )}
    </m.div>
  );
}
