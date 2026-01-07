'use client';

import { useState, useMemo } from 'react';
import { useDates } from '@/hooks/useDates';
import DateCard from '@/components/DateManager/DateCard';
import AddDateModal from '@/components/DateManager/AddDateModal';
import { Plus, Calendar, Sparkles, ListChecks, Clock } from 'lucide-react';
import { CATEGORIES, DateCategory } from '@/types';
import Login from '@/components/Login';
import clsx from 'clsx';

export default function Home() {
  const { dates, addDate, deleteDate, isLoaded } = useDates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<DateCategory | '全部'>('全部');

  const upcomingDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Sort logic inside
    return dates
      .filter(d => new Date(d.date).getTime() >= todayStart && (filter === '全部' || d.category === filter))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dates, filter]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-500">載入中...</div>;

  return (
    // Added pt-28 to prevent navbar overlap (Navbar is ~70px)
    <div className="container mx-auto px-4 py-8 pt-28 max-w-5xl">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 mt-4">
        {/* 左側標題 */}
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">
             歡迎回來，饅頭perfect！
          </h1>
          <p className="text-slate-400 text-lg flex items-center gap-2">
             <Sparkles size={18} className="text-yellow-400" />
             今天也是充滿活力的一天
          </p>
        </div>

        {/* 右側登入按鈕 (新增這塊) */}
        <div className="shrink-0">
          <Login />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Summary / Actions (Span 4) */}
        <div className="md:col-span-5 flex flex-col gap-6">
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
                onClick={() => {
                  console.log('Open modal clicked');
                  setIsModalOpen(true);
                }}
                className="btn-primary w-full max-w-[200px] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                新增行程
              </button>
           </div>

           {/* Quick Stats or Quote (Optional) */}
           {/* Quick Stats */}
           <div className="glass-card p-5 grid grid-cols-2 divide-x divide-white/10">
              <div className="relative flex flex-col items-center justify-center text-center px-4 py-2 group overflow-hidden">
                 <Clock className="absolute right-0 -bottom-2 w-16 h-16 text-blue-500/5 -rotate-12 transition-transform group-hover:scale-110 pointer-events-none" />
                 <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-400 z-10 relative">
                    {upcomingDates.length}
                 </p>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest -mt-1 z-10 relative">即將到來</p>
              </div>
              
              <div className="relative flex flex-col items-center justify-center text-center px-4 py-2 group overflow-hidden">
                 <ListChecks className="absolute right-0 -bottom-2 w-16 h-16 text-pink-500/5 -rotate-12 transition-transform group-hover:scale-110 pointer-events-none" />
                 <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-orange-400 z-10 relative">
                    {dates.length}
                 </p>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest -mt-1 z-10 relative">總計</p>
              </div>
           </div>
        </div>

        {/* Right Column: Upcoming List (Span 8) */}
        <div className="md:col-span-7">
           <div className="glass-card h-full min-h-[500px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 overflow-hidden">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2 whitespace-nowrap shrink-0">
                    <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                    即將到來的活動
                 </h3>
                 
                 {/* Filter Pills with Horizontal Scroll */}
                 <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar scroll-smooth">
                    <button 
                      onClick={() => setFilter('全部')}
                      className={clsx(
                        "text-xs px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 font-medium",
                        filter === '全部' ? "bg-white text-black border-white shadow-lg shadow-white/10" : "border-white/20 text-slate-400 hover:border-white/50 hover:bg-white/5"
                      )}
                    >
                      全部
                    </button>
                    {CATEGORIES.map(c => (
                       <button
                         key={c} 
                         onClick={() => setFilter(c)}
                         className={clsx(
                           "text-xs px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 font-medium",
                           filter === c ? "bg-white text-black border-white shadow-lg shadow-white/10" : "border-white/20 text-slate-400 hover:border-white/50 hover:bg-white/5"
                         )}
                       >
                         {c}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-3">
                 {upcomingDates.length > 0 ? (
                   upcomingDates.map(item => (
                     <DateCard key={item.id} item={item} onDelete={deleteDate} />
                   ))
                 ) : (
                   <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                      <p>目前沒有即將到來的行程</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

      </div>

      <AddDateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addDate} 
      />
    </div>
  );
}
