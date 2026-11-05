'use client';

import { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { FamilyMember, ExpenseItem } from '@/types';
import { Plus, ChevronLeft, ChevronRight, CheckSquare, ReceiptText } from 'lucide-react';
import { AnimatePresence, m, type Variants } from 'motion/react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';
import MemberFilter from '@/components/ExpenseManager/MemberFilter';
import ExpenseSummary from '@/components/ExpenseManager/ExpenseSummary';
import ExpenseCard from '@/components/ExpenseManager/ExpenseCard';
import AddExpenseModal from '@/components/ExpenseManager/AddExpenseModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import BatchToolbar from '@/components/ui/BatchToolbar';
import EmptyState from '@/components/ui/EmptyState';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import LoadingGate from '@/components/ui/LoadingGate';
import { DURATION } from '@/lib/motion';

// 依切換方向滑動；exit 透過 custom 取得最新方向，避免反向切換時舊月份從錯誤的一側離開
const monthVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 16 }),
  center: { opacity: 1, x: 0, transition: { duration: DURATION.base } },
  leave: (direction: number) => ({ opacity: 0, x: direction * -16, transition: { duration: DURATION.fast } }),
};

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, deleteExpenses, isLoaded } = useExpenses();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | '全體'>('全體');

  // 月份切換；direction 記錄方向，讓月份文字依前進／後退滑動
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [direction, setDirection] = useState<1 | -1>(1);

  // 批次操作
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 篩選當月且符合成員的資料
  const filteredExpenses = useMemo(() => {
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth() + 1;

    return expenses.filter(item => {
      // 1. 月份篩選
      const itemDate = new Date(item.date);
      const isSameMonth = itemDate.getFullYear() === targetYear && (itemDate.getMonth() + 1) === targetMonth;
      if (!isSameMonth) return false;

      // 2. 成員篩選
      if (selectedMember !== '全體' && item.member !== selectedMember) return false;

      return true;
    });
  }, [expenses, currentDate, selectedMember]);

  const prevMonth = () => {
    setDirection(-1);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setDirection(1);
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 未登入提示
  useEffect(() => {
    if (isLoaded && !auth.currentUser) {
      toast('歡迎！請先登入以使用帳本功能 🔒', { icon: '👋', duration: 5000 });
    }
  }, [isLoaded]);

  // 批次操作處理
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExpenses.map(d => d.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const monthLabel = `${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月`;

  return (
    <LoadingGate isLoaded={isLoaded} label="正在整理家庭帳本...">
      <PageShell>
        <PageHeader title="家庭帳本" visuallyHidden />

        {/* 頂部月份切換與操作 */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 rounded-2xl border-2 border-dashed border-[#dcd0c2]/50 bg-[#dcd0c2]/30 p-1">
            <IconButton aria-label="上個月" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </IconButton>
            <div className="relative flex h-11 min-w-[8.5rem] items-center justify-center overflow-hidden" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <m.span
                  key={monthLabel}
                  custom={direction}
                  variants={monthVariants}
                  initial="enter"
                  animate="center"
                  exit="leave"
                  className="text-lg font-bold"
                >
                  {monthLabel}
                </m.span>
              </AnimatePresence>
            </div>
            <IconButton aria-label="下個月" onClick={nextMonth}>
              <ChevronRight size={20} />
            </IconButton>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant={batchMode ? 'secondary' : 'soft'}
              aria-pressed={batchMode}
              className="flex-1 sm:flex-none"
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedIds([]);
              }}
            >
              <CheckSquare size={16} aria-hidden="true" />
              {batchMode ? '完成' : '批次選取'}
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={openAddModal}>
              <Plus size={16} aria-hidden="true" />
              記一筆
            </Button>
          </div>
        </div>

        {/* 成員篩選 */}
        <MemberFilter selectedMember={selectedMember} onChange={setSelectedMember} />

        {/* 批次操作工具列 */}
        <AnimatePresence initial={false}>
          {batchMode && (
            <div key="batch-toolbar" className="mb-6">
              <BatchToolbar
                selectedCount={selectedIds.length}
                totalCount={filteredExpenses.length}
                onToggleAll={toggleSelectAll}
                onDelete={handleBatchDelete}
              />
            </div>
          )}
        </AnimatePresence>

        {/* 統計圖表區 */}
        <ExpenseSummary expenses={filteredExpenses} selectedMember={selectedMember} />

        {/* 紀錄列表：新增、刪除與復原都會有進出場，initial={false} 避免首次進頁面時整排播放 */}
        {filteredExpenses.length > 0 ? (
          <ul className="space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredExpenses.map(item => (
                <ExpenseCard
                  key={item.id}
                  item={item}
                  onDelete={deleteExpense}
                  onEdit={(expense) => {
                    setEditingExpense(expense);
                    setIsModalOpen(true);
                  }}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                  batchMode={batchMode}
                />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="本月尚無紀錄"
            description="點擊上方「記一筆」開始記錄。"
          />
        )}

        {/* 新增/編輯 Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <AddExpenseModal
              key={editingExpense?.id ?? 'new'}
              isOpen
              onClose={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
              }}
              initialData={editingExpense}
              defaultMember={selectedMember === '全體' ? '共同' : selectedMember}
              onSubmit={async (data) => {
                return editingExpense ? updateExpense(editingExpense.id, data) : addExpense(data);
              }}
            />
          )}
        </AnimatePresence>

        <ConfirmDialog
          danger
          isOpen={isDeleteDialogOpen}
          title="刪除選取的記錄？"
          description={`將刪除 ${selectedIds.length} 筆帳本記錄，此操作可在完成後透過提示訊息復原。`}
          confirmLabel="刪除記錄"
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            deleteExpenses(selectedIds);
            setSelectedIds([]);
            setBatchMode(false);
            setIsDeleteDialogOpen(false);
          }}
        />
      </PageShell>
    </LoadingGate>
  );
}
