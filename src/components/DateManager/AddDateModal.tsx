'use client';

import { useState } from 'react';
import { X, Check, Plus, Settings2, Trash2 } from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { getTodayDateString } from '@/lib/date';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryTimePresets } from '@/hooks/useCategoryTimePresets';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import Modal, { ModalActions } from '@/components/Modal';
import { AnimatePresence, m } from 'motion/react';
import Collapsible from '@/components/ui/Collapsible';
import { listItem } from '@/lib/motion';
import type { CategoryColorMap } from '@/lib/categoryColors';
import DatePicker from '@/components/ui/DatePicker';
import TimeRangePicker, { type TimeField } from '@/components/ui/TimeRangePicker';
import CategoryPicker from '@/components/DateManager/CategoryPicker';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DateItem, 'id'>) => Promise<boolean>;
  initialData?: DateItem | null;
  presetDate?: string | null; // 從月曆點擊傳入的預設日期 (YYYY-MM-DD)
  categoryColors: CategoryColorMap;
}

// 同一時間只展開一個選擇面板：手機畫面短，同時展開日期與時間會把操作列擠出視窗
type ActivePicker = 'date' | TimeField | null;

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
  categoryColors,
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
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

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
  const [subCatActiveField, setSubCatActiveField] = useState<TimeField | null>(null);

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
      toast.error('請輸入行程標題！');
      return;
    }
    if (!date) {
      toast.error('請選擇日期！');
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
      if (saved) {
        setSubCatForm({ name: '', startTime: '', endTime: '' });
        setSubCatActiveField(null);
      }
      return saved;
    }, false);
  };

  const subCategories = getSubCategories(category);

  return (
    <Modal isOpen={isOpen} title={initialData ? '編輯行程' : '新增行程'} onClose={close} size="sheet"
      isBusy={isSubmitting} onSubmit={handleSubmit}
      footer={<ModalActions onClose={close} isSubmitting={isSubmitting}>{initialData ? '確認修改' : '確認新增'}</ModalActions>}>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6 border-0 p-0">
        <label className="modal-field">行程標題
          <input required className="modal-input" placeholder="例如：阿弟排班" value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <DatePicker
          label="日期"
          value={date}
          onChange={setDate}
          isOpen={activePicker === 'date'}
          onOpenChange={isPickerOpen => setActivePicker(isPickerOpen ? 'date' : null)}
        />

        <TimeRangePicker
          ariaLabel="行程時間"
          startTime={startTime}
          endTime={endTime}
          onStartChange={setStartTime}
          onEndChange={setEndTime}
          activeField={activePicker === 'date' ? null : activePicker}
          onActiveFieldChange={setActivePicker}
        />

        {/* 分類放在時間下方：選分類仍會自動帶入標題與該分類的預設時間 */}
        <section className="space-y-3" aria-labelledby="add-date-category-heading">
          <div className="flex items-center justify-between gap-2">
            <h3 id="add-date-category-heading" className="text-sm font-bold text-[#3d3a36]">分類</h3>
            <button
              type="button"
              onClick={() => setShowSubCatManager(v => !v)}
              className={clsx(
                'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors duration-fast ease-out-expo',
                showSubCatManager
                  ? 'bg-[#5f7186] text-[#f0ece1]'
                  : 'text-[#5f7186] hover:bg-[#5f7186]/10'
              )}
              aria-label={`管理「${category}」的子分類`}
              aria-expanded={showSubCatManager}
              title="設定此分類的子分類時間"
            >
              <Settings2 size={14} aria-hidden="true" />
              子分類時間
            </button>
          </div>

          <CategoryPicker
            categories={categories}
            value={category}
            onChange={handleSelectCategory}
            categoryColors={categoryColors}
            trailing={!showAddCategory && (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-[#dcd0c2] px-3.5 py-1.5 text-sm font-medium text-[#5f6368] transition-colors duration-fast ease-out-expo hover:border-[#5f7186]/50 hover:text-[#5f7186]"
                aria-label="新增自訂類別"
              >
                <Plus size={16} aria-hidden="true" />
                自訂類別
              </button>
            )}
          />

          {/* 自訂類別輸入列佔滿整行，用收合展開避免下方欄位瞬間被推開 */}
          <Collapsible>{showAddCategory && (
            <div className="flex w-full min-w-0 items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddCategory(); }
                }}
                placeholder="類別名稱"
                className="modal-input"
                aria-label="自訂類別名稱"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                aria-label="儲存自訂類別"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5f7186] text-[#f0ece1] transition-colors duration-fast hover:bg-[#47576b]"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                aria-label="取消新增類別"
                onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dcd0c2]/50 text-[#3d3a36] transition-colors duration-fast hover:bg-[#dcd0c2]/80"
              >
                <X size={18} />
              </button>
            </div>
          )}</Collapsible>

          {/* 子分類快速選擇：直接顯示時間，選之前就知道會帶入什麼 */}
          <Collapsible>{subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subCategories.map(sub => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => handleSelectSubCategory(sub.name, sub.startTime, sub.endTime)}
                  aria-pressed={title === sub.name}
                  className={clsx(
                    'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors duration-fast ease-out-expo',
                    title === sub.name
                      ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]'
                      : 'border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50'
                  )}
                >
                  {sub.name}
                  <span className="text-xs font-medium tabular-nums opacity-80">
                    {sub.startTime}{sub.endTime ? `–${sub.endTime}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}</Collapsible>

          {/* inline 子分類管理器 */}
          <Collapsible>{showSubCatManager && (
            <div className="space-y-3 rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 p-4">
              <p className="text-xs font-bold text-[#3d3a36]">
                「{category}」的子分類設定
              </p>

              {/* 既有子分類清單 */}
              {subCategories.length > 0 && (
                <div className="space-y-1.5 border-b border-dashed border-[#dcd0c2] pb-3">
                  {/* 刪除子分類後其他列順勢補位，initial={false} 避免開啟面板時整排播放 */}
                  <AnimatePresence initial={false} mode="popLayout">
                  {subCategories.map(sub => (
                    <m.div
                      key={sub.name}
                      layout="position"
                      variants={listItem}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-center gap-2 text-sm text-[#3d3a36]"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{sub.name}</span>
                      <span className="tabular-nums text-[#5f6368]">
                        {sub.startTime}{sub.endTime ? ` ~ ${sub.endTime}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => submit(() => deleteSubCategory(category, sub.name), false)}
                        className="modal-icon-button"
                        aria-label={`刪除子分類 ${sub.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </m.div>
                  ))}
                  </AnimatePresence>
                </div>
              )}

              {/* 新增子分類表單 */}
              <input
                type="text"
                value={subCatForm.name}
                onChange={e => setSubCatForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => {
                  // 子分類屬於局部設定，Enter 不應誤送出整份行程。
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSaveSubCat(); }
                }}
                placeholder="名稱（如週六班）"
                className="modal-input"
                aria-label="子分類名稱"
              />
              <TimeRangePicker
                ariaLabel="子分類時間"
                startTime={subCatForm.startTime}
                endTime={subCatForm.endTime}
                onStartChange={value => setSubCatForm(f => ({ ...f, startTime: value }))}
                onEndChange={value => setSubCatForm(f => ({ ...f, endTime: value }))}
                activeField={subCatActiveField}
                onActiveFieldChange={setSubCatActiveField}
                startLabel="開始"
                endLabel="結束（選填）"
              />
              <button
                type="button"
                onClick={handleSaveSubCat}
                disabled={!subCatForm.name.trim() || !subCatForm.startTime}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#5f7186] px-4 text-sm font-bold text-[#f0ece1] transition-colors duration-fast hover:bg-[#47576b] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="儲存子分類"
              >
                <Check size={16} aria-hidden="true" />
                儲存子分類
              </button>
            </div>
          )}</Collapsible>
        </section>

        <label className="modal-field">備註（選填）
          <textarea rows={3} className="modal-input resize-y" value={description} onChange={e => setDescription(e.target.value)} placeholder="其他行程資訊" />
        </label>
      </fieldset>
    </Modal>
  );
}
