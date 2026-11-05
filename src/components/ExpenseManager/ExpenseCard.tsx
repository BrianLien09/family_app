'use client';

import { ExpenseItem, MEMBER_COLORS } from '@/types';
import clsx from 'clsx';
import { Trash2, Edit2 } from 'lucide-react';
import { m } from 'motion/react';
import IconButton from '@/components/ui/IconButton';
import SelectCheckbox from '@/components/ui/SelectCheckbox';
import { listItem } from '@/lib/motion';

interface ExpenseCardProps {
  item: ExpenseItem;
  onDelete: (id: string) => void;
  onEdit: (item: ExpenseItem) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  batchMode: boolean;
}

export default function ExpenseCard({ item, onDelete, onEdit, isSelected, onToggleSelect, batchMode }: ExpenseCardProps) {
  const isIncome = item.type === 'income';

  return (
    <m.li
      layout="position"
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      // 批次模式下整張卡片就是一個勾選框，需要對應的語意與鍵盤操作
      role={batchMode ? 'checkbox' : undefined}
      aria-checked={batchMode ? isSelected : undefined}
      tabIndex={batchMode ? 0 : undefined}
      onKeyDown={batchMode ? event => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          onToggleSelect(item.id);
        }
      } : undefined}
      className={clsx(
        'glass-card flex list-none items-center gap-4 p-4 transition-colors duration-200',
        batchMode && 'cursor-pointer hover:bg-[#dcd0c2]/50',
        isSelected && 'border-[#5f7186]/60 bg-[#5f7186]/10',
      )}
      onClick={() => batchMode && onToggleSelect(item.id)}
    >
      {batchMode && <SelectCheckbox checked={isSelected} />}

      {/* 成員 Avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#f0ece1]"
        style={{ backgroundColor: MEMBER_COLORS[item.member] }}
      >
        {item.member.substring(0, 1)}
      </div>

      {/* 內容 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-[#3d3a36]">{item.category}</span>
          {item.description && (
            <span className="hidden truncate text-xs text-[#5f6368] sm:inline-block">{item.description}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-[#5f6368]">
          <span>{item.date}</span>
          <span className="h-1 w-1 rounded-full bg-[#78716c]" />
          <span>{item.member}</span>
        </div>
      </div>

      {/* 金額 & 操作 */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className={clsx('text-lg font-bold tabular-nums', isIncome ? 'text-[#5f7186]' : 'text-[#b87e6b]')}>
          {isIncome ? '+' : '-'}${item.amount.toLocaleString()}
        </div>
        {!batchMode && (
          <div className="flex items-center">
            <IconButton
              tone="accent"
              aria-label={`編輯${item.category}記錄`}
              onClick={event => {
                event.stopPropagation();
                onEdit(item);
              }}
            >
              <Edit2 size={18} />
            </IconButton>
            <IconButton
              tone="danger"
              aria-label={`刪除${item.category}記錄`}
              onClick={event => {
                event.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 size={18} />
            </IconButton>
          </div>
        )}
      </div>
    </m.li>
  );
}
