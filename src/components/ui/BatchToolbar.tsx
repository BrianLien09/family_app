'use client';

import { Trash2 } from 'lucide-react';
import { m } from 'motion/react';
import { popIn } from '@/lib/motion';
import Button from '@/components/ui/Button';

interface BatchToolbarProps {
  selectedCount: number;
  totalCount: number;
  onToggleAll: () => void;
  onDelete: () => void;
}

/**
 * 批次操作列：取代食譜、帳本頁各自手刻的版本。
 * 進出場由呼叫端以 AnimatePresence 包住，這裡負責 popIn 變體。
 */
export default function BatchToolbar({ selectedCount, totalCount, onToggleAll, onDelete }: BatchToolbarProps) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  return (
    <m.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="glass-card flex flex-wrap items-center justify-between gap-3 p-3"
    >
      <div className="flex items-center gap-3">
        <Button size="sm" variant="soft" onClick={onToggleAll} disabled={totalCount === 0}>
          {allSelected ? '取消全選' : '全選'}
        </Button>
        <span className="text-sm font-medium text-[#5f7186]" aria-live="polite">已選擇 {selectedCount} 筆</span>
      </div>
      <Button size="sm" variant="danger" onClick={onDelete} disabled={selectedCount === 0}>
        <Trash2 size={16} aria-hidden="true" />
        刪除
      </Button>
    </m.div>
  );
}
