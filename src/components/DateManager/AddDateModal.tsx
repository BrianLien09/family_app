'use client';

import { useState } from 'react';
import { X, Calendar, Type, Hash, AlignLeft } from 'lucide-react';
import { DateItem, CATEGORIES, DateCategory } from '@/types';

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: DateItem) => void;
}

export default function AddDateModal({ isOpen, onClose, onAdd }: AddDateModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<DateCategory>('其它');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleManualSubmit = () => {
    if (!title.trim()) {
      alert('請輸入行程標題！');
      return;
    }
    if (!date) {
      alert('請選擇日期！');
      return;
    }

    try {
      onAdd({
        id: Date.now().toString(),
        title,
        date,
        time,
        category,
        description
      });
      
      // Reset and close
      setTitle('');
      setDate('');
      setTime('');
      setCategory('其它');
      setDescription('');
      onClose();
    } catch (error) {
       console.error(error);
       alert('新增失敗，請稍後再試。');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-0 overflow-hidden shadow-2xl animate-scale-in border border-white/10 bg-[#1a1d2d]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
             新增行程
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-5">
          
          <div className="space-y-4">
             <div className="relative">
                <Type className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  autoFocus
                  className="glass-input pl-10"
                  placeholder="行程標題 (例如：阿弟排班)" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input 
                    type="date"
                    className="glass-input pl-10 text-slate-300 cursor-pointer" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
               </div>
               <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <input 
                    type="time"
                    className="glass-input pl-10 text-slate-300 cursor-pointer" 
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
               </div>
               <div className="relative col-span-2 md:col-span-1">
                  <Hash className="absolute left-3 top-3 text-slate-500" size={18} />
                  <select 
                    className="glass-input pl-10 appearance-none text-slate-300 cursor-pointer"
                    value={category}
                    onChange={e => setCategory(e.target.value as DateCategory)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="bg-slate-800">{c}</option>
                    ))}
                  </select>
               </div>
             </div>

             <div className="relative">
                <AlignLeft className="absolute left-3 top-3 text-slate-500" size={18} />
                <textarea 
                  className="glass-input pl-10 min-h-[100px] resize-none"
                  placeholder="備註 (選填)" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button 
              type="button"
              onClick={handleManualSubmit}
              className="btn-primary py-2.5 px-8"
            >
              確認新增
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
