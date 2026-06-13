import { useState } from 'react';
import { X } from 'lucide-react';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';
import { FamilyMember, FAMILY_MEMBERS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ExpenseItem, MEMBER_COLORS } from '@/types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { useEffect } from 'react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ExpenseItem, 'id'>) => void;
  initialData?: ExpenseItem | null;
  defaultMember?: FamilyMember;
}

export default function AddExpenseModal({ isOpen, onClose, onSubmit, initialData, defaultMember }: AddExpenseModalProps) {
  useImmersiveMode(isOpen);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [member, setMember] = useState<FamilyMember>('共同');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [description, setDescription] = useState('');

  // 監聽 initialData 或 defaultMember 變化
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setCategory(initialData.category);
        setMember(initialData.member);
        setDate(initialData.date);
        setDescription(initialData.description || '');
      } else {
        // 重置為預設
        setType('expense');
        setAmount('');
        setCategory(EXPENSE_CATEGORIES[0]);
        setMember(defaultMember || '共同');
        const today = new Date();
        setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        setDescription('');
      }
    }
  }, [isOpen, initialData, defaultMember]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('請輸入有效的金額');
      return;
    }
    
    onSubmit({
      type,
      amount: Number(amount),
      category: type === 'income' ? '收入' : category,
      member,
      date,
      description: description.trim()
    });
    
    // Reset form
    setAmount('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1d2d] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{initialData ? '編輯紀錄' : '新增紀錄'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:px-6 sm:py-4 space-y-3">
          {/* 收支切換 */}
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                if (type !== 'expense') {
                  setType('expense');
                  setCategory(EXPENSE_CATEGORIES[0]);
                }
              }}
              className={clsx(
                "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all",
                type === 'expense' ? "bg-rose-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => {
                if (type !== 'income') {
                  setType('income');
                  setCategory(INCOME_CATEGORIES[0]);
                }
              }}
              className={clsx(
                "flex-1 py-1.5 text-sm font-bold rounded-lg transition-all",
                type === 'income' ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              收入
            </button>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="0"
                required
                min="1"
              />
            </div>
          </div>

          {/* 誰的消費 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">成員</label>
            <div className="flex flex-wrap gap-2">
              {FAMILY_MEMBERS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMember(m)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    member === m ? "text-white" : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10"
                  )}
                  style={{
                    backgroundColor: member === m ? MEMBER_COLORS[m] : undefined,
                    borderColor: member === m ? MEMBER_COLORS[m] : undefined,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 分類 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">分類</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <option key={c} value={c} className="bg-[#1a1d2d]">{c}</option>
              ))}
            </select>
          </div>

          {/* 日期 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">備註 (選填)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="例如：午餐買便當"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98]"
          >
            {initialData ? '儲存修改' : '儲存紀錄'}
          </button>
        </form>
      </div>
    </div>
  );
}
