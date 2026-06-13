import { ExpenseItem, MEMBER_COLORS } from '@/types';
import clsx from 'clsx';
import { Trash2, Edit2 } from 'lucide-react';

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
    <div 
      className={clsx(
        "glass-card p-4 flex items-center gap-4 transition-all",
        batchMode && "cursor-pointer hover:bg-[#dcd0c2]/50",
        isSelected && "border-[#5f7186]/50 bg-[#5f7186]/10"
      )}
      onClick={() => batchMode && onToggleSelect(item.id)}
    >
      {/* 批次選取 Checkbox */}
      {batchMode && (
        <div className="shrink-0">
          <div className={clsx(
            "w-5 h-5 rounded border-2 border-dashed flex items-center justify-center transition-all duration-200",
            isSelected ? "bg-[#5f7186] border-[#5f7186]/50" : "border-slate-500"
          )}>
            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
          </div>
        </div>
      )}

      {/* 成員 Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#f0ece1] font-bold text-sm shrink-0 shadow-[0_8px_20px_rgba(139,121,101,0.08)]"
        style={{ backgroundColor: MEMBER_COLORS[item.member] }}
      >
        {item.member.substring(0, 1)}
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#3d3a36] truncate">
            {item.category}
          </span>
          {item.description && (
            <span className="text-xs text-[#3d3a36] truncate hidden sm:inline-block">
              {item.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#3d3a36] mt-1">
          <span>{item.date}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{item.member}</span>
        </div>
      </div>

      {/* 金額 & 刪除 */}
      <div className="flex items-center gap-4 shrink-0">
        <div className={clsx(
          "font-bold text-lg",
          isIncome ? "text-[#5f7186]" : "text-[#b87e6b]"
        )}>
          {isIncome ? '+' : '-'}${item.amount.toLocaleString()}
        </div>
        {!batchMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 text-[#3d3a36] hover:text-[#5f7186] hover:bg-[#5f7186]/10 rounded-lg transition-all duration-200"
              aria-label="編輯記錄"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#b87e6b]/20 rounded-lg transition-all duration-200"
              aria-label="刪除記錄"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
