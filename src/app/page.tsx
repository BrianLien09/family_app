'use client';

import { useState, useMemo } from 'react';
import { useDates } from '@/hooks/useDates';
// 1. 👇 引入剛剛建立的 CalendarWidget (原本的 DateCard 可以拿掉或留著備用)
import CalendarWidget from '@/components/CalendarWidget'; 
import AddDateModal from '@/components/DateManager/AddDateModal';
import { Plus, Calendar, Sparkles, ListChecks, Clock } from 'lucide-react';
import { CATEGORIES, DateCategory, DateItem } from '@/types';
import Login from '@/components/Login';
import clsx from 'clsx';
import { useImmersiveMode } from '@/hooks/useImmersiveMode';

export default function Home() {
  const { dates, addDate, deleteDate, updateDate, isLoaded } = useDates();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<DateItem | null>(null);
  
  // 雖然月曆會顯示所有日期，但如果你想保留過濾邏輯給其他用途可以留著
  const [filter, setFilter] = useState<DateCategory | '全部'>('全部');

  const upcomingDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return dates
      .filter(d => new Date(d.date).getTime() >= todayStart && (filter === '全部' || d.category === filter))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dates, filter]);

  const handleOpenAdd = () => {
    setEditingDate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dateItem: DateItem) => {
    setEditingDate(dateItem);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: any) => {
    if (editingDate) {
      updateDate(editingDate.id, data);
    } else {
      addDate(data);
    }
    setIsModalOpen(false);
    setEditingDate(null);
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-500">載入中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 max-w-5xl">
      
      {/* --- Hero Header (完全保持不變) --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">
             歡迎回來，饅頭perfect！
          </h1>
          <p className="text-slate-400 text-lg flex items-center gap-2">
             <Sparkles size={18} className="text-yellow-400" />
             今天也是充滿活力的一天
          </p>
        </div>
        <div className="shrink-0">
          <Login />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* --- Left Column: Summary / Actions (完全保持不變) --- */}
        <div className="md:col-span-3 flex flex-col gap-6">
           <div className="glass-card flex flex-col items-center justify-center text-center py-10 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 rotate-3 group-hover:rotate-6 transition-transform">
                 <Calendar className="text-white w-10 h-10" />
             </div>
             
             <h2 className="text-3xl font-bold text-white mb-1">
                 {new Date().getDate()}
             </h2>
             <p className="text-blue-200 uppercase tracking-widest text-xs font-semibold mb-6">
                 {new Date().toLocaleString('zh-TW', { month: 'long' })}
             </p>

             <button 
               onClick={handleOpenAdd}
               className="btn-primary w-full max-w-[200px] flex items-center justify-center gap-2"
             >
               <Plus size={20} />
               新增行程
             </button>
           </div>

           {/* Quick Stats */}
           <div className="glass-card p-5 grid grid-cols-2 divide-x divide-white/10">
              <div className="relative flex flex-col items-center justify-center text-center px-4 py-2 group overflow-hidden">
                 <Clock className="absolute right-0 -bottom-2 w-16 h-16 text-blue-500/5 -rotate-12 transition-transform group-hover:scale-110 pointer-events-none" />
                 <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-400 z-10 relative">
                    {upcomingDates.length}
                 </p>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest -mt-1 z-10 relative">即將到來</p>
              </div>
              
              <div className="relative flex flex-col items-center justify-center text-center px-4 py-2 group overflow-hidden">
                 <ListChecks className="absolute right-0 -bottom-2 w-16 h-16 text-pink-500/5 -rotate-12 transition-transform group-hover:scale-110 pointer-events-none" />
                 <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-orange-400 z-10 relative">
                    {dates.length}
                 </p>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest -mt-1 z-10 relative">總計</p>
              </div>
           </div>
        </div>

        {/* --- Right Column: 改為放置月曆元件 --- */}
        <div className="md:col-span-9">
           {/* 2. 👇 這裡直接使用 CalendarWidget 取代原本的列表 */}
           {/* 我們傳入完整的 dates，讓月曆自己處理顯示 */}
           <CalendarWidget 
              events={dates} 
              onSelectDate={(date) => {
                 // 選填：如果你想在點擊月曆日期時做些什麼，可以在這裡加邏輯
                 console.log("選擇了日期:", date);
            }}
            onDelete={deleteDate}      // 傳入刪除功能
            onEdit={handleOpenEdit}    // 傳入編輯功能
           />
        </div>

      </div>

      {/* Modal (保持不變) */}
      <AddDateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
        initialData={editingDate}
      />
    </div>
  );
}