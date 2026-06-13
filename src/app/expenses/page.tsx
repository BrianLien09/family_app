'use client';

import { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { FamilyMember, ExpenseItem } from '@/types';
import { Plus, ChevronLeft, ChevronRight, CheckSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';
import MemberFilter from '@/components/ExpenseManager/MemberFilter';
import ExpenseSummary from '@/components/ExpenseManager/ExpenseSummary';
import ExpenseCard from '@/components/ExpenseManager/ExpenseCard';
import AddExpenseModal from '@/components/ExpenseManager/AddExpenseModal';
import clsx from 'clsx';

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, deleteExpenses, isLoaded } = useExpenses();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | '全體'>('全體');
  
  // 月份切換
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 批次操作
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

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

  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // 未登入提示
  useEffect(() => {
    if (isLoaded && !auth.currentUser) {
      toast('歡迎！請先登入以使用帳本功能 🔒', {
        icon: '👋',
        duration: 5000,
        style: { background: '#333', color: '#fff', borderRadius: '10px' },
      });
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
    if (confirm(`確定要刪除 ${selectedIds.length} 筆記錄嗎？`)) {
      deleteExpenses(selectedIds);
      setSelectedIds([]);
      setBatchMode(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-500">載入中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 max-w-3xl min-h-screen">
      {/* 頂部標題與月份切換 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 border border-white/10">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-lg min-w-[120px] text-center">
            {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={clsx(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
              batchMode ? "bg-purple-500/20 text-purple-400 border-purple-500/50" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            )}
          >
            <CheckSquare size={16} />
            {batchMode ? '完成' : '批次選取'}
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            記一筆
          </button>
        </div>
      </div>

      {/* 成員篩選 */}
      <MemberFilter selectedMember={selectedMember} onChange={setSelectedMember} />

      {/* 批次操作工具列 */}
      {batchMode && (
        <div className="glass-card p-3 mb-6 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              {selectedIds.length === filteredExpenses.length ? '取消全選' : '全選'}
            </button>
            <span className="text-sm text-purple-400 font-medium">已選擇 {selectedIds.length} 筆</span>
          </div>
          <button
            onClick={handleBatchDelete}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            刪除
          </button>
        </div>
      )}

      {/* 統計圖表區 */}
      <ExpenseSummary expenses={filteredExpenses} selectedMember={selectedMember} />

      {/* 紀錄列表 */}
      <div className="space-y-3">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map(item => (
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
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10 border-dashed">
            <p className="mb-2">本月尚無紀錄 📝</p>
            <p className="text-sm">點擊右上角「記一筆」開始記錄</p>
          </div>
        )}
      </div>

      {/* 新增/編輯 Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
        defaultMember={selectedMember === '全體' ? '共同' : selectedMember}
        onSubmit={(data) => {
          if (editingExpense) {
            updateExpense(editingExpense.id, data);
          } else {
            addExpense(data);
          }
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
      />
    </div>
  );
}
