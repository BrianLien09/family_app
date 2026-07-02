'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Type, Calendar, Clock, AlignLeft, Hash, Check, Plus, Settings2, Trash2
} from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryTimePresets } from '@/hooks/useCategoryTimePresets';
import clsx from 'clsx';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DateItem, 'id'>) => void;
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
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<DateCategory>('其它');
  const [description, setDescription] = useState('');

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

  const { categories, addCategory, deleteCategory, isDefaultCategory } = useCategories();
  const { getDefaultTime, saveDefaultTime, getSubCategories, saveSubCategory, deleteSubCategory } =
    useCategoryTimePresets();

  // 用 ref 追蹤上一次 isOpen 的值，判斷是否剛剛「開啟 → Modal 」轉換
  const prevIsOpenRef = useRef(false);

  useImmersiveMode(isOpen);

  // 1. Modal 開啟時填入初始值（利用 prevIsOpenRef 讓效果只在「關→開」時觸發，
  //    避免 presets 變化時覆蓋使用者正在編輯的輸入）
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened) return;

    if (initialData) {
      // 編輯模式：填入現有資料
      setTitle(initialData.title);
      setDate(initialData.date);
      setStartTime(initialData.startTime || '');
      setEndTime(initialData.endTime || '');
      setCategory(initialData.category || '其它');
      setDescription(initialData.description || '');
    } else {
      // 新增模式
      const defaultDate = presetDate || new Date().toISOString().split('T')[0];
      setDate(defaultDate);
      setDescription('');

      // 讀取上一次成功新增行程時所選用的分類 (LocalStorage)
      const lastCategory = localStorage.getItem('last_selected_category') || '其它';
      // 確保該分類依然存在於分類清單中，否則回退到 '其它'
      const resolvedCategory = categories.includes(lastCategory) ? lastCategory : '其它';
      setCategory(resolvedCategory);

      // 直接將分類名稱導入到行程標題
      setTitle(resolvedCategory);

      // 嘗試帶入該分類的預設時間；若無則使用四捨五入到整點的當前時間
      const preset = getDefaultTime(resolvedCategory);
      setStartTime(preset.startTime || getRoundedHourString());
      setEndTime(preset.endTime || '');
    }

    // 重置 inline UI 狀態
    setShowAddCategory(false);
    setNewCategoryName('');
    setShowSubCatManager(false);
    setSubCatForm({ name: '', startTime: '', endTime: '' });
  }, [isOpen, initialData, presetDate, getDefaultTime, categories]);

  // 2. ESC 關閉
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

    onSubmit({ title, date, startTime, endTime, category, description });

    // 只有新增模式才自動記憶時間與分類（編輯模式不覆蓋）
    if (!initialData) {
      localStorage.setItem('last_selected_category', category);
      if (startTime) {
        await saveDefaultTime(category, startTime, endTime);
      }
    }

    onClose();
  };

  // 新增自訂類別
  const handleAddCategory = () => {
    if (addCategory(newCategoryName)) {
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  // 刪除類別
  const handleDeleteCategory = (categoryToDelete: string) => {
    if (deleteCategory(categoryToDelete)) {
      if (category === categoryToDelete) setCategory('其它');
    }
  };

  // 儲存子分類
  const handleSaveSubCat = async () => {
    if (!subCatForm.name.trim() || !subCatForm.startTime) return;
    await saveSubCategory(category, subCatForm.name, subCatForm.startTime, subCatForm.endTime);
    setSubCatForm({ name: '', startTime: '', endTime: '' });
  };

  const subCategories = getSubCategories(category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full sm:max-w-md max-h-[92vh] bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] shadow-2xl rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col animate-slide-up">

        {/* 手機版拖曳把手 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#dcd0c2]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 id="modal-title" className="text-lg font-bold text-[#3d3a36] flex items-center gap-2.5">
            <span className="w-1 h-5 bg-[#5f7186] rounded-full" />
            {initialData ? '編輯行程' : '新增行程'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200"
            aria-label="關閉對話框"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-3 overflow-y-auto flex-1">

          {/* 標題 */}
          <div className="group relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3d3a36] group-focus-within:text-[#5f7186] transition-all duration-200">
              <Type size={16} />
            </div>
            <input
              required
              autoFocus
              className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg pl-10 pr-4 py-2.5 text-[#3d3a36] placeholder-[#78716c]/70 focus:outline-none focus:border-[#b87e6b] focus:ring-2 focus:ring-[#b87e6b]/30 transition-all text-sm"
              placeholder="行程標題 (例如：阿弟排班)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="行程標題"
            />
          </div>

          {/* 日期 & 時間 */}
          <div className="space-y-2">
            {/* 日期 */}
            <div className="group relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3d3a36] group-focus-within:text-[#5f7186] transition-all duration-200">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                required
                className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg pl-10 pr-4 py-2.5 text-[#3d3a36] focus:outline-none focus:border-[#b87e6b] focus:ring-2 focus:ring-[#b87e6b]/30 transition-all  text-sm"
                value={date}
                onChange={e => setDate(e.target.value)}
                aria-label="日期"
              />
            </div>

            {/* 時間區段 */}
            <div className="grid grid-cols-2 gap-2">
              {(['開始時間', '結束時間'] as const).map((label, i) => (
                <div key={label} className="group relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3d3a36] group-focus-within:text-[#5f7186] transition-all duration-200">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg pl-10 pr-3 py-2.5 text-[#3d3a36] focus:outline-none focus:border-[#b87e6b] focus:ring-2 focus:ring-[#b87e6b]/30 transition-all  text-sm"
                    value={i === 0 ? startTime : endTime}
                    onChange={e => i === 0 ? setStartTime(e.target.value) : setEndTime(e.target.value)}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>

            {startTime && endTime && (
              <p className="text-xs text-[#3d3a36] pl-0.5">
                時間區段：{startTime} ~ {endTime}
              </p>
            )}
          </div>

          {/* 分類選擇 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#3d3a36]">
              <Hash size={13} />
              <span className="text-xs font-bold uppercase tracking-wider">選擇分類</span>
            </div>

            {/* 分類按鈕列 */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="行程分類">
              {categories.map((cat: string) => (
                <div key={cat} className="relative group/category">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      category === cat
                        ? 'bg-[#5f7186] border-[#5f7186]/50 text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/20'
                        : 'bg-[#f0ece1] border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186]'
                    )}
                    aria-label={`分類: ${cat}`}
                    aria-pressed={category === cat}
                  >
                    {cat}
                  </button>
                  {/* 刪除按鈕（自訂類別才有） */}
                  {!isDefaultCategory(cat) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-[#3d3a36] rounded-full flex items-center justify-center opacity-0 group-hover/category:opacity-100 transition-opacity"
                      aria-label={`刪除類別 ${cat}`}
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}

              {/* 新增類別按鈕 */}
              {!showAddCategory ? (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f0ece1] border-2 border-dashed border-dashed border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186] transition-all"
                  aria-label="新增自訂類別"
                >
                  <Plus size={13} className="inline mr-0.5" />
                  自訂類別
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                    }}
                    placeholder="類別名稱"
                    className="px-2.5 py-1.5 bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg text-[#3d3a36] text-xs focus:outline-none focus:border-[#b87e6b] w-24"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-2 py-1.5 bg-[#5f7186] hover:bg-[#5f7186] text-[#f0ece1] rounded-lg text-xs transition-all duration-200"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                    className="px-2 py-1.5 bg-[#dcd0c2]/50 hover:bg-[#dcd0c2]/80 text-[#3d3a36] rounded-lg text-xs transition-all duration-200"
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
                  'px-2.5 py-1.5 rounded-lg text-xs transition-all border',
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
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] text-[#3d3a36] hover:border-[#5f7186]/50 hover:text-[#5f7186] transition-all"
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
                          onClick={() => deleteSubCategory(category, sub.name)}
                          className="ml-auto text-slate-600 hover:text-[#b87e6b] transition-all duration-200"
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    value={subCatForm.name}
                    onChange={e => setSubCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="名稱（如週六班）"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg text-[#3d3a36] text-xs focus:outline-none focus:border-[#b87e6b]"
                  />
                  <input
                    type="time"
                    value={subCatForm.startTime}
                    onChange={e => setSubCatForm(f => ({ ...f, startTime: e.target.value }))}
                    className="px-2 py-1.5 bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg text-[#3d3a36] text-xs focus:outline-none focus:border-[#b87e6b] "
                    aria-label="子分類開始時間"
                  />
                  <input
                    type="time"
                    value={subCatForm.endTime}
                    onChange={e => setSubCatForm(f => ({ ...f, endTime: e.target.value }))}
                    className="px-2 py-1.5 bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg text-[#3d3a36] text-xs focus:outline-none focus:border-[#b87e6b] "
                    aria-label="子分類結束時間（選填）"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSubCat}
                    disabled={!subCatForm.name.trim() || !subCatForm.startTime}
                    className="px-2.5 py-1.5 bg-[#5f7186] hover:bg-[#5f7186] disabled:opacity-40 disabled:cursor-not-allowed text-[#f0ece1] rounded-lg text-xs transition-all duration-200"
                    aria-label="儲存子分類"
                  >
                    <Check size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 備註 */}
          <div className="group relative">
            <div className="absolute left-3.5 top-3.5 text-[#3d3a36] group-focus-within:text-[#5f7186] transition-all duration-200">
              <AlignLeft size={16} />
            </div>
            <textarea
              className="w-full bg-[#f0ece1] border-2 border-dashed border-[#dcd0c2] rounded-lg pl-10 pr-4 py-2.5 text-[#3d3a36] placeholder-[#78716c]/70 focus:outline-none focus:border-[#b87e6b] focus:ring-2 focus:ring-[#b87e6b]/30 transition-all resize-none h-16 text-sm"
              placeholder="備註 (選填)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-label="備註"
            />
          </div>

          {/* 底部按鈕 */}
          <div className="pt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30 transition-all duration-200 font-medium text-sm"
              aria-label="取消"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-[#b87e6b] hover:bg-[#a66a58] text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/20 transition-all font-bold flex items-center gap-1.5 text-sm"
              aria-label={initialData ? '確認修改' : '確認新增'}
            >
              <Check size={16} />
              {initialData ? '確認修改' : '確認新增'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}