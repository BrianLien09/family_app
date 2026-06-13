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
      <div className="relative w-full max-w-md bg-[#f0ece1] rounded-2xl shadow-2xl border-2 border-dashed border-dashed border-[#dcd0c2]/50 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[#dcd0c2]/50">
          <h2 className="text-xl font-bold text-[#3d3a36]">{initialData ? '編輯紀錄' : '新增紀錄'}</h2>
          <button onClick={onClose} className="p-1.5 text-[#3d3a36] hover:text-[#b87e6b] rounded-lg hover:bg-[#dcd0c2]/50 transition-all duration-200">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:px-6 sm:py-4 space-y-3">
          {/* 收支切換 */}
          <div className="flex bg-[#dcd0c2]/30 rounded-xl p-1">
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
                type === 'expense' ? "bg-[#b87e6b] text-[#f0ece1] shadow-[0_4px_12px_rgba(139,121,101,0.06)]" : "text-[#3d3a36] hover:text-[#b87e6b]"
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
                type === 'income' ? "bg-[#5f7186] text-[#f0ece1] shadow-[0_4px_12px_rgba(139,121,101,0.06)]" : "text-[#3d3a36] hover:text-[#b87e6b]"
              )}
            >
              收入
            </button>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-[#3d3a36] mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d3a36]">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#3d3a36] placeholder-slate-500 focus:outline-none focus:border-[#b87e6b] transition-all duration-200"
                placeholder="0"
                required
                min="1"
              />
            </div>
          </div>

          {/* 誰的消費 */}
          <div>
            <label className="block text-sm font-medium text-[#3d3a36] mb-1">成員</label>
            <div className="flex flex-wrap gap-2">
              {FAMILY_MEMBERS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMember(m)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    member === m ? "text-[#f0ece1]" : "bg-[#dcd0c2]/30 text-[#3d3a36] border-transparent hover:bg-[#dcd0c2]/50"
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
            <label className="block text-sm font-medium text-[#3d3a36] mb-1">分類</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#3d3a36] focus:outline-none focus:border-[#b87e6b] transition-all duration-200 appearance-none"
            >
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <option key={c} value={c} className="bg-[#f0ece1]">{c}</option>
              ))}
            </select>
          </div>

          {/* 日期 */}
          <div>
            <label className="block text-sm font-medium text-[#3d3a36] mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#3d3a36] focus:outline-none focus:border-[#b87e6b] transition-all duration-200"
              required
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-[#3d3a36] mb-1">備註 (選填)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#3d3a36] placeholder-slate-500 focus:outline-none focus:border-[#b87e6b] transition-all duration-200"
              placeholder="例如：午餐買便當"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-[#b87e6b] hover:bg-[#a66a58] text-[#f0ece1] font-bold rounded-xl shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/20 transition-all active:scale-[0.98]"
          >
            {initialData ? '儲存修改' : '儲存紀錄'}
          </button>
        </form>
      </div>
    </div>
  );
}
