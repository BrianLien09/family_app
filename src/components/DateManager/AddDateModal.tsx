'use client';

import { useState } from 'react';
import {
  X, Hash, Check, Plus, Settings2, Trash2
} from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { getTodayDateString } from '@/lib/date';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryTimePresets } from '@/hooks/useCategoryTimePresets';
import clsx from 'clsx';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DateItem, 'id'>) => Promise<boolean>;
  initialData?: DateItem | null;
  presetDate?: string | null; // 從月曆點擊傳入的預設日期 (YYYY-MM-DD)
}

/**
 * 取得四捨五入到整點的當前時間字串 (HH:mm)
 * 若分鐘 >= 30，則進位到下一個小時整點
 * 若分鐘 < 30，則捨去到當前小時整點
 */
function getRoundedHourString(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  let roundedHours = hours;
  if (minutes >= 30) {
    roundedHours = (hours + 1) % 24;
  }

  return `${String(roundedHours).padStart(2, '0')}:00`;
}

// 子分類管理的 inline 表單狀態
interface SubCatFormState {
  name: string;
  startTime: string;
  endTime: string;
}

export default function AddDateModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  presetDate,
}: AddDateModalProps) {
  const { categories: syncedCategories, addCategory } = useCategories();
  const categories = initialData?.category && !syncedCategories.includes(initialData.category)
    ? [...syncedCategories, initialData.category]
    : syncedCategories;
  const { getDefaultTime, saveDefaultTime, getSubCategories, saveSubCategory, deleteSubCategory } =
    useCategoryTimePresets();
  const initialCategory = initialData?.category
    ?? (typeof window === 'undefined' ? '其它' : localStorage.getItem('last_selected_category') || '其它');
  const resolvedInitialCategory = categories.includes(initialCategory) ? initialCategory : '其它';

  const { isSubmitting, submit, close } = useFormSubmission(onClose);

  const [title, setTitle] = useState(() => initialData?.title ?? resolvedInitialCategory);
  const [date, setDate] = useState(() => initialData?.date ?? presetDate ?? getTodayDateString());
  const [startTime, setStartTime] = useState(() => initialData?.startTime ?? (getDefaultTime(resolvedInitialCategory).startTime || getRoundedHourString()));
  const [endTime, setEndTime] = useState(() => initialData?.endTime ?? (getDefaultTime(resolvedInitialCategory).endTime || ''));
  const [category, setCategory] = useState<DateCategory>(() => resolvedInitialCategory);
  const [description, setDescription] = useState(() => initialData?.description ?? '');

  // 自訂類別相關
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 子分類 inline 管理
  const [showSubCatManager, setShowSubCatManager] = useState(false);
  const [subCatForm, setSubCatForm] = useState<SubCatFormState>({
    name: '',
    startTime: '',
    endTime: '',
  });

  if (!isOpen) return null;

  // 選擇分類時，自動帶入該分類的預設時間，並將分類名稱導入行程標題
  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    setShowSubCatManager(false);

    // 將大分類名稱導入行程標題
    setTitle(cat);

    const preset = getDefaultTime(cat);
    if (preset.startTime) setStartTime(preset.startTime);
    if (preset.endTime !== undefined) setEndTime(preset.endTime ?? '');
  };

  // 點選子分類時帶入對應時間，並將子分類名稱導入行程標題
  const handleSelectSubCategory = (name: string, startT: string, endT?: string) => {
    setTitle(name);
    setStartTime(startT);
    setEndTime(endT || '');
  };

  // 送出行程，同時記憶本次時間與分類
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入行程標題！');
      return;
    }
    if (!date) {
      alert('請選擇日期！');
      return;
    }

    await submit(async () => {
      const saved = await onSubmit({ title, date, startTime, endTime, category, description });
      if (saved && !initialData) {
        try {
          localStorage.setItem('last_selected_category', category);
        } catch (error) {
          console.error('儲存上次分類失敗：', error);
        }
        if (startTime) await saveDefaultTime(category, startTime, endTime);
      }
      return saved;
    });
  };

  // 新增自訂類別
  const handleAddCategory = async () => {
    await submit(async () => {
      const saved = await addCategory(newCategoryName);
      if (!saved) return false;
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
      return true;
    }, false);
  };

  // 儲存子分類
  const handleSaveSubCat = async () => {
    if (!subCatForm.name.trim() || !subCatForm.startTime) return;
    await submit(async () => {
      const saved = await saveSubCategory(category, subCatForm.name, subCatForm.startTime, subCatForm.endTime);
      if (saved) setSubCatForm({ name: '', startTime: '', endTime: '' });
      return saved;
    }, false);
  };

  const subCategories = getSubCategories(category);

  return (
    <Modal isOpen={isOpen} title={initialData ? '編輯行程' : '新增行程'} onClose={close}
      isBusy={isSubmitting} onSubmit={handleSubmit}
      footer={<ModalActions onClose={close} isSubmitting={isSubmitting}>{initialData ? '確認修改' : '確認新增'}</ModalActions>}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-5 border-0 p-0">
        <label className="modal-field">行程標題
          <input required className="modal-input" placeholder="例如：阿弟排班" value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="modal-field">日期
          <input type="date" required className="modal-input" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="modal-field">開始時間<input type="time" className="modal-input" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
          <label className="modal-field">結束時間（選填）<input type="time" className="modal-input" value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
        </div>
          {/* 分類選擇 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#3d3a36]">
              <Hash size={13} />
              <span className="text-sm font-medium">選擇分類</span>
            </div>

            {/* 分類按鈕列 */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="行程分類">
              {categories.map((cat: string) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={clsx(
                      'modal-choice',
                      category === cat
                        ? 'bg-[#5f7186] border-[#5f7186]/50 text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/20'
                        : 'bg-[#f0ece1] border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186]'
                    )}
                    aria-label={`分類: ${cat}`}
                    aria-pressed={category === cat}
                  >
                    {cat}
                  </button>
              ))}

              {/* 新增類別按鈕 */}
              {!showAddCategory ? (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="min-h-11 px-3 py-2 rounded-xl text-sm font-medium bg-[#f0ece1] border-2 border-dashed border-dashed border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186] transition-all"
                  aria-label="新增自訂類別"
                >
                  <Plus size={13} className="inline mr-0.5" />
                  自訂類別
                </button>
              ) : (
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                    }}
                    placeholder="類別名稱"
                    className="modal-input"
                    aria-label="自訂類別名稱"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    aria-label="儲存自訂類別"
                    className="min-h-11 px-3 py-2 bg-[#5f7186] hover:bg-[#5f7186] text-[#f0ece1] rounded-lg text-xs transition-all duration-200"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="取消新增類別"
                    onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                    className="min-h-11 px-3 py-2 bg-[#dcd0c2]/50 hover:bg-[#dcd0c2]/80 text-[#3d3a36] rounded-lg text-xs transition-all duration-200"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* 子分類管理按鈕（選中分類後才顯示） */}
              <button
                type="button"
                onClick={() => setShowSubCatManager(v => !v)}
                className={clsx(
                  'min-h-11 px-3 py-2 rounded-xl text-sm transition-all border',
                  showSubCatManager
                    ? 'bg-[#5f7186] border-[#5f7186] text-[#f0ece1]'
                    : 'bg-[#f0ece1] border-[#dcd0c2] text-[#3d3a36] hover:text-[#5f7186] hover:border-[#5f7186]'
                )}
                aria-label={`管理「${category}」的子分類`}
                title="設定此分類的子分類時間"
              >
                <Settings2 size={13} />
              </button>
            </div>

            {/* 子分類快速選擇列（若有子分類才顯示） */}
            {subCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-0.5">
                {subCategories.map(sub => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => handleSelectSubCategory(sub.name, sub.startTime, sub.endTime)}
                    className="min-h-11 px-3 py-2 rounded-xl text-sm font-medium bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186] transition-all"
                    title={`${sub.startTime}${sub.endTime ? ` ~ ${sub.endTime}` : ''}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            {/* inline 子分類管理器 */}
            {showSubCatManager && (
              <div className="mt-1.5 p-3 bg-[#dcd0c2]/30 border-2 border-dashed border-[#dcd0c2] rounded-lg space-y-2">
                <p className="text-xs text-[#3d3a36] font-medium">
                  「{category}」的子分類設定
                </p>

                {/* 既有子分類清單 */}
                {subCategories.length > 0 && (
                  <div className="space-y-1.5">
                    {subCategories.map(sub => (
                      <div
                        key={sub.name}
                        className="flex items-center gap-2 text-xs text-[#3d3a36]"
                      >
                        <span className="font-medium w-16 shrink-0 truncate">{sub.name}</span>
                        <span className="text-[#3d3a36]">
                          {sub.startTime}{sub.endTime ? ` ~ ${sub.endTime}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => submit(() => deleteSubCategory(category, sub.name), false)}
                          className="ml-auto modal-icon-button"
                          aria-label={`刪除子分類 ${sub.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-[#dcd0c2] pt-1" />
                  </div>
                )}

                {/* 新增子分類表單 */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={subCatForm.name}
                    onChange={e => setSubCatForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => {
                      // 子分類屬於局部設定，Enter 不應誤送出整份行程。
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSaveSubCat(); }
                    }}
                    placeholder="名稱（如週六班）"
                    className="modal-input col-span-2"
                    aria-label="子分類名稱"
                  />
                  <input
                    type="time"
                    value={subCatForm.startTime}
                    onChange={e => setSubCatForm(f => ({ ...f, startTime: e.target.value }))}
                    className="modal-input"
                    aria-label="子分類開始時間"
                  />
                  <input
                    type="time"
                    value={subCatForm.endTime}
                    onChange={e => setSubCatForm(f => ({ ...f, endTime: e.target.value }))}
                    className="modal-input"
                    aria-label="子分類結束時間（選填）"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSubCat}
                    disabled={!subCatForm.name.trim() || !subCatForm.startTime}
                    className="min-h-11 px-3 py-2 bg-[#5f7186] hover:bg-[#5f7186] disabled:opacity-40 disabled:cursor-not-allowed text-[#f0ece1] rounded-lg text-xs transition-all duration-200"
                    aria-label="儲存子分類"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>


        <label className="modal-field">備註（選填）
          <textarea rows={3} className="modal-input resize-y" value={description} onChange={e => setDescription(e.target.value)} placeholder="其他行程資訊" />
        </label>
      </fieldset>
    </Modal>
  );
}
