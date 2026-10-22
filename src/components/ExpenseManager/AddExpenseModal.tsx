'use client';

import { useState } from 'react';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';
import { FamilyMember, FAMILY_MEMBERS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ExpenseItem, MEMBER_COLORS } from '@/types';
import { getTodayDateString } from '@/lib/date';
import clsx from 'clsx';
import toast from 'react-hot-toast';


interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ExpenseItem, 'id'>) => Promise<boolean>;
  initialData?: ExpenseItem | null;
  defaultMember?: FamilyMember;
}

export default function AddExpenseModal({ isOpen, onClose, onSubmit, initialData, defaultMember }: AddExpenseModalProps) {

  const { isSubmitting, submit, close } = useFormSubmission(onClose);

  const [type, setType] = useState<'expense' | 'income'>(() => initialData?.type ?? 'expense');
  const [amount, setAmount] = useState(() => initialData?.amount.toString() ?? '');
  const [category, setCategory] = useState<string>(() => initialData?.category ?? EXPENSE_CATEGORIES[0]);
  const [member, setMember] = useState<FamilyMember>(() => initialData?.member ?? defaultMember ?? '共同');
  const [date, setDate] = useState(() => initialData?.date ?? getTodayDateString());
  const [description, setDescription] = useState(() => initialData?.description ?? '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      toast.error('請輸入有效的金額');
      return;
    }
    
    await submit(() => onSubmit({
      type,
      amount: Number(amount),
      // 選單的選擇就是儲存值，避免填寫收入分類後被固定文字覆蓋。
      category,
      member,
      date,
      description: description.trim()
    }));
  };

  return (
    <Modal isOpen={isOpen} title={initialData ? '編輯紀錄' : '新增紀錄'} onClose={close} closeOnBackdrop
      isBusy={isSubmitting} onSubmit={handleSubmit}
      footer={<ModalActions onClose={close} isSubmitting={isSubmitting}>{initialData ? '儲存修改' : '儲存紀錄'}</ModalActions>}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-5 border-0 p-0">
          {/* 收支切換 */}
          <div className="flex bg-[#dcd0c2]/30 rounded-xl p-1">
            <button
              type="button"
              aria-pressed={type === 'expense'}
              onClick={() => {
                if (type !== 'expense') {
                  setType('expense');
                  setCategory(EXPENSE_CATEGORIES[0]);
                }
              }}
              className={clsx(
                "flex-1 min-h-11 py-2 text-sm font-bold rounded-lg transition-all",
                type === 'expense' ? "bg-[#b87e6b] text-[#f0ece1] shadow-[0_4px_12px_rgba(139,121,101,0.06)]" : "text-[#3d3a36] hover:text-[#b87e6b]"
              )}
            >
              支出
            </button>
            <button
              type="button"
              aria-pressed={type === 'income'}
              onClick={() => {
                if (type !== 'income') {
                  setType('income');
                  setCategory(INCOME_CATEGORIES[0]);
                }
              }}
              className={clsx(
                "flex-1 min-h-11 py-2 text-sm font-bold rounded-lg transition-all",
                type === 'income' ? "bg-[#5f7186] text-[#f0ece1] shadow-[0_4px_12px_rgba(139,121,101,0.06)]" : "text-[#3d3a36] hover:text-[#b87e6b]"
              )}
            >
              收入
            </button>
          </div>

          {/* 金額 */}
          <label className="modal-field"><span>金額</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d3a36]">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="modal-input pl-8"
                inputMode="decimal"
                placeholder="0"
                required
                min="1"
              />
            </div>
          </label>

          {/* 誰的消費 */}
          <fieldset className="min-w-0"><legend className="mb-2 text-sm font-medium">成員</legend>
            <div className="flex flex-wrap gap-2">
              {FAMILY_MEMBERS.map(m => (
                <button
                  key={m}
                  aria-pressed={member === m}
                  type="button"
                  onClick={() => setMember(m)}
                  className={clsx(
                    "min-h-11 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
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
          </fieldset>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* 分類 */}
          <label className="modal-field"><span>分類</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="modal-input"
            >
              {initialData && !(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).some(value => value === category) && <option value={category}>{category}</option>}
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <option key={c} value={c} className="bg-[#f0ece1]">{c}</option>
              ))}
            </select>
          </label>

          {/* 日期 */}
          <label className="modal-field"><span>日期</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="modal-input"
              required
            />
          </label>
          </div>

          {/* 備註 */}
          <label className="modal-field"><span>備註 (選填)</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="modal-input"
              placeholder="例如：午餐買便當"
            />
          </label>

      </fieldset>
    </Modal>
  );
}
