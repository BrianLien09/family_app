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
      setTitle('');
      setDate(defaultDate);
      setDescription('');
      setCategory('其它');

      // 嘗試帶入「其它」分類的預設時間；若無則用當下時間
      const preset = getDefaultTime('其它');
      setStartTime(preset.startTime || new Date().toTimeString().slice(0, 5));
      setEndTime(preset.endTime || '');
    }

    // 重置 inline UI 狀態
    setShowAddCategory(false);
    setNewCategoryName('');
    setShowSubCatManager(false);
    setSubCatForm({ name: '', startTime: '', endTime: '' });
  }, [isOpen, initialData, presetDate, getDefaultTime]);

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

  // 選擇分類時，自動帶入該分類的預設時間
  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    setShowSubCatManager(false);

    const preset = getDefaultTime(cat);
    if (preset.startTime) setStartTime(preset.startTime);
    if (preset.endTime !== undefined) setEndTime(preset.endTime ?? '');
  };

  // 點選子分類時帶入對應時間
  const handleSelectSubCategory = (startT: string, endT?: string) => {
    setStartTime(startT);
    setEndTime(endT || '');
  };

  // 送出行程，同時記憶本次時間
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

    // 只有新增模式才自動記憶時間（編輯模式不覆蓋）
    if (!initialData && startTime) {
      await saveDefaultTime(category, startTime, endTime);
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-[#161b2c] border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 id="modal-title" className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="w-1 h-5 bg-purple-500 rounded-full" />
            {initialData ? '編輯行程' : '新增行程'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="關閉對話框"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-3">

          {/* 標題 */}
          <div className="group relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
              <Type size={16} />
            </div>
            <input
              required
              autoFocus
              className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
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
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <Calendar size={16} />
              </div>
              <input
                type="date"
                required
                className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark] text-sm"
                value={date}
                onChange={e => setDate(e.target.value)}
                aria-label="日期"
              />
            </div>

            {/* 時間區段 */}
            <div className="grid grid-cols-2 gap-2">
              {(['開始時間', '結束時間'] as const).map((label, i) => (
                <div key={label} className="group relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark] text-sm"
                    value={i === 0 ? startTime : endTime}
                    onChange={e => i === 0 ? setStartTime(e.target.value) : setEndTime(e.target.value)}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>

            {startTime && endTime && (
              <p className="text-xs text-slate-500 pl-0.5">
                時間區段：{startTime} ~ {endTime}
              </p>
            )}
          </div>

          {/* 分類選擇 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
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
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-[#1e2336] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
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
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/category:opacity-100 transition-opacity"
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
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e2336] border border-dashed border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-all"
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
                    className="px-2.5 py-1.5 bg-[#1e2336] border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 w-24"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs transition-colors"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                    className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors"
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
                    ? 'bg-slate-600 border-slate-500 text-white'
                    : 'bg-[#1e2336] border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
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
                    onClick={() => handleSelectSubCategory(sub.startTime, sub.endTime)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 border border-slate-600 text-slate-300 hover:border-purple-500 hover:text-purple-300 transition-all"
                    title={`${sub.startTime}${sub.endTime ? ` ~ ${sub.endTime}` : ''}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            {/* inline 子分類管理器 */}
            {showSubCatManager && (
              <div className="mt-1.5 p-3 bg-[#1a1f33] border border-slate-700 rounded-lg space-y-2">
                <p className="text-xs text-slate-400 font-medium">
                  「{category}」的子分類設定
                </p>

                {/* 既有子分類清單 */}
                {subCategories.length > 0 && (
                  <div className="space-y-1.5">
                    {subCategories.map(sub => (
                      <div
                        key={sub.name}
                        className="flex items-center gap-2 text-xs text-slate-300"
                      >
                        <span className="font-medium w-16 shrink-0 truncate">{sub.name}</span>
                        <span className="text-slate-500">
                          {sub.startTime}{sub.endTime ? ` ~ ${sub.endTime}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteSubCategory(category, sub.name)}
                          className="ml-auto text-slate-600 hover:text-red-400 transition-colors"
                          aria-label={`刪除子分類 ${sub.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-1" />
                  </div>
                )}

                {/* 新增子分類表單 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    value={subCatForm.name}
                    onChange={e => setSubCatForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="名稱（如週六班）"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-[#1e2336] border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="time"
                    value={subCatForm.startTime}
                    onChange={e => setSubCatForm(f => ({ ...f, startTime: e.target.value }))}
                    className="px-2 py-1.5 bg-[#1e2336] border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    aria-label="子分類開始時間"
                  />
                  <input
                    type="time"
                    value={subCatForm.endTime}
                    onChange={e => setSubCatForm(f => ({ ...f, endTime: e.target.value }))}
                    className="px-2 py-1.5 bg-[#1e2336] border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    aria-label="子分類結束時間（選填）"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSubCat}
                    disabled={!subCatForm.name.trim() || !subCatForm.startTime}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs transition-colors"
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
            <div className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-purple-400 transition-colors">
              <AlignLeft size={16} />
            </div>
            <textarea
              className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all resize-none h-16 text-sm"
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
              className="px-5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
              aria-label="取消"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all font-bold flex items-center gap-1.5 text-sm"
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