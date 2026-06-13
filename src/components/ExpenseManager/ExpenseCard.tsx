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
        batchMode && "cursor-pointer hover:bg-white/10",
        isSelected && "border-purple-500/50 bg-purple-500/10"
      )}
      onClick={() => batchMode && onToggleSelect(item.id)}
    >
      {/* 批次選取 Checkbox */}
      {batchMode && (
        <div className="shrink-0">
          <div className={clsx(
            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
            isSelected ? "bg-purple-500 border-purple-500" : "border-slate-500"
          )}>
            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
          </div>
        </div>
      )}

      {/* 成員 Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
        style={{ backgroundColor: MEMBER_COLORS[item.member] }}
      >
        {item.member.substring(0, 1)}
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white truncate">
            {item.category}
          </span>
          {item.description && (
            <span className="text-xs text-slate-400 truncate hidden sm:inline-block">
              {item.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>{item.date}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{item.member}</span>
        </div>
      </div>

      {/* 金額 & 刪除 */}
      <div className="flex items-center gap-4 shrink-0">
        <div className={clsx(
          "font-bold text-lg",
          isIncome ? "text-emerald-400" : "text-white"
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
              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
              aria-label="編輯記錄"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
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
