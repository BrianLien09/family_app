'use client';

import { useState, useEffect } from 'react';
import { X, Type, Calendar, Clock, AlignLeft, Hash, Check } from 'lucide-react';
import { DateItem, CATEGORIES, DateCategory } from '@/types';
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
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<DateCategory>('其它');
  const [description, setDescription] = useState('');
  useImmersiveMode(isOpen);

  // 1. 自動填入資料的 Effect (保持原本邏輯)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 編輯模式：填入現有資料
        setTitle(initialData.title);
        setDate(initialData.date);
        setTime(initialData.time || '');
        setCategory(initialData.category || '其它');
        setDescription(initialData.description || '');
      } else {
        // 新增模式：使用預設日期（若有）或今天
        const defaultDate = presetDate || new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().slice(0, 5);
        setTitle('');
        setDate(defaultDate);
        setTime(now);
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
      time,
      category,
      description
    });
    onClose();
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

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
             <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                   <Clock size={18} />
                </div>
                <input 
                  type="time"
                  className="w-full bg-[#1e2336] border border-slate-700 rounded-lg pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all [color-scheme:dark]"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  aria-label="時間"
                />
             </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Hash size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">選擇分類</span>
             </div>
             <div className="flex flex-wrap gap-2" role="group" aria-label="行程分類">
                {CATEGORIES.map(cat => (
                   <button
                     key={cat}
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
                ))}
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