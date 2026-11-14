'use client';

import { useState } from 'react';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';
import { FamilyMember, FAMILY_MEMBERS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ExpenseItem, MEMBER_COLORS } from '@/types';
import { getTodayDateString } from '@/lib/date';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SegmentedToggle, { type SegmentedOption } from '@/components/ui/SegmentedToggle';

// 支出用主色鐵鏽、收入用輔色石板藍，與帳本卡片與統計的配色一致
const TYPE_OPTIONS: readonly SegmentedOption<'expense' | 'income'>[] = [
  { value: 'expense', label: '支出', color: '#b87e6b' },
  { value: 'income', label: '收入', color: '#5f7186' },
];

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
          <SegmentedToggle
            ariaLabel="收支類型"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(nextType) => {
              setType(nextType);
              // 切換收支時分類清單不同，重設為該類型的第一個分類，避免送出不存在的分類
              setCategory(nextType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
            }}
          />

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
                    "min-h-11 px-3 py-2 rounded-xl text-sm font-medium transition-colors border",
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
