'use client';

import { useState, useEffect } from 'react';
import { X, Type, Calendar, Clock, AlignLeft, Hash, Check, Plus, Trash2 } from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import clsx from 'clsx';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: DateItem | null;
  presetDate?: string | null; // 從月曆點擊傳入的預設日期 (YYYY-MM-DD)
}

export default function AddDateModal({ isOpen, onClose, onSubmit, initialData, presetDate }: AddDateModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<DateCategory>('其它');
  const [description, setDescription] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { categories, addCategory, deleteCategory, isDefaultCategory } = useCategories();
  useImmersiveMode(isOpen);

  // 1. 自動填入資料的 Effect (保持原本邏輯)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 編輯模式：填入現有資料
        setTitle(initialData.title);
        setDate(initialData.date);
        setStartTime(initialData.startTime || '');
        setEndTime(initialData.endTime || '');
        setCategory(initialData.category || '其它');
        setDescription(initialData.description || '');
      } else {
        // 新增模式：使用預設日期（若有）或今天
        const defaultDate = presetDate || new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().slice(0, 5);
        setTitle('');
        setDate(defaultDate);
        setStartTime(now);
        setEndTime('');
        setCategory('其它');
        setDescription('');
      }
    }
  }, [isOpen, initialData, presetDate]);

  // 2. ESC 鍵盤快捷鍵
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);



  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入行程標題！');
      return;
    }
    if (!date) {
      alert('請選擇日期！');
      return;
    }

    onSubmit({
      title,
      date,
      startTime,
      endTime,
      category,
      description
    });
    onClose();
  };

  // 處理新增自訂類別
  const handleAddCategory = () => {
    if (addCategory(newCategoryName)) {
      setNewCategoryName('');
      setShowAddCategory(false);
      setCategory(newCategoryName.trim());
    }
  };

  // 處理刪除類別
  const handleDeleteCategory = (categoryToDelete: string) => {
    if (deleteCategory(categoryToDelete)) {
      // 如果刪除的是當前選中的類別，重設為「其它」
      if (category === categoryToDelete) {
        setCategory('其它');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 卡片本體：保持你喜歡的深色實心簡潔風格 */}
      <div className="w-full max-w-md bg-[#161b2c] border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
           <h2 id="modal-title" className="text-xl font-bold text-white flex items-center gap-3">
             <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
             {initialData ? '編輯行程' : '新增行程'}
           </h2>
           <button 
             onClick={onClose} 
             className="text-slate-400 hover:text-white transition-colors"
             aria-label="關閉對話框"
           >
             <X size={24} />
           </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Title */}
          <div className="group relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <Type size={18} />
             </div>
             <input 
               required
               autoFocus
               className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-base"
               placeholder="行程標題 (例如：阿弟排班)"
               value={title}
               onChange={e => setTitle(e.target.value)}
               aria-label="行程標題"
             />
          </div>

          {/* Date & Time Range */}
          <div className="space-y-3">
            {/* 日期 */}
            <div className="group relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <Calendar size={18} />
              </div>
              <input 
                type="date"
                required
                className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark]"
                value={date}
                onChange={e => setDate(e.target.value)}
                aria-label="日期"
              />
            </div>

            {/* 時間區段（選填） */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Clock size={18} />
                </div>
                <input 
                  type="time"
                  className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark]"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  aria-label="開始時間"
                  placeholder="開始"
                />
              </div>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <Clock size={18} />
                </div>
                <input 
                  type="time"
                  className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark]"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  aria-label="結束時間"
                  placeholder="結束"
                />
              </div>
            </div>
            {startTime && endTime && (
              <p className="text-xs text-slate-500 pl-1">
                時間區段：{startTime} ~ {endTime}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Hash size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">選擇分類</span>
             </div>
             <div className="flex flex-wrap gap-2" role="group" aria-label="行程分類">
                {categories.map((cat: string) => (
                   <div key={cat} className="relative group/category">
                     <button
                       type="button"
                       onClick={() => setCategory(cat)}
                       className={clsx(
                         "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                         category === cat 
                           ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                           : "bg-[#1e2336] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                       )}
                       aria-label={`分類: ${cat}`}
                       aria-pressed={category === cat}
                     >
                       {cat}
                     </button>
                     {/* 刪除按鈕（僅自訂類別可刪） */}
                     {!isDefaultCategory(cat) && (
                       <button
                         type="button"
                         onClick={() => handleDeleteCategory(cat)}
                         className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/category:opacity-100 transition-opacity"
                         aria-label={`刪除類別 ${cat}`}
                       >
                         <X size={12} />
                       </button>
                     )}
                   </div>
                ))}

                {/* 新增類別按鈕 */}
                {!showAddCategory ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1e2336] border border-dashed border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-all"
                    aria-label="新增自訂類別"
                  >
                    <Plus size={16} className="inline mr-1" />
                    自訂類別
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="類別名稱"
                      className="px-3 py-2 bg-[#1e2336] border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
             </div>
          </div>

          {/* Description */}
          <div className="group relative">
             <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                <AlignLeft size={18} />
             </div>
             <textarea 
               className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all resize-none h-24"
               placeholder="備註 (選填)"
               value={description}
               onChange={e => setDescription(e.target.value)}
               aria-label="備註"
             />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-3">
             <button 
               type="button" 
               onClick={onClose} 
               className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
               aria-label="取消"
             >
                取消
             </button>
             <button 
               type="submit" 
               className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all font-bold flex items-center gap-2"
               aria-label={initialData ? '確認修改' : '確認新增'}
             >
                <Check size={18} />
                {initialData ? '確認修改' : '確認新增'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}