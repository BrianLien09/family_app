'use client';

import { useState, useMemo } from 'react';
import { useDates } from '@/hooks/useDates';
import CalendarWidget from '@/components/CalendarWidget'; 
import AddDateModal from '@/components/DateManager/AddDateModal';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import { CATEGORIES, DateCategory, DateItem } from '@/types';
import Login from '@/components/Login';
import clsx from 'clsx';

export default function Home() {
  const { dates, addDate, deleteDate, updateDate, isLoaded } = useDates();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<DateItem | null>(null);
  
  const [filter, setFilter] = useState<DateCategory | '全部'>('全部');

  const upcomingDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return dates
      .filter(d => new Date(d.date).getTime() >= todayStart)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dates]);

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
      
      {/* --- Hero Header --- */}
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
        
        {/* --- 左側欄位 (3等份) --- */}
        <div className="md:col-span-3 flex flex-col gap-6">
           
           {/* 1. 日期與新增按鈕卡片 */}
           <div className="glass-card flex flex-col items-center justify-center text-center py-8 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 group-hover:rotate-6 transition-transform">
                 <Calendar className="text-white w-8 h-8" />
             </div>
             
             <h2 className="text-3xl font-bold text-white mb-1">
                 {new Date().getDate()}
             </h2>
             <p className="text-blue-200 uppercase tracking-widest text-xs font-semibold mb-6">
                 {new Date().toLocaleString('zh-TW', { month: 'long' })}
             </p>

             <button 
               onClick={handleOpenAdd}
               className="btn-primary w-full max-w-[180px] flex items-center justify-center gap-2 text-sm"
             >
               <Plus size={18} />
               新增行程
             </button>
           </div>

           {/* 2. 近期行程快訊 (已改為顯示 4 個) */}
           <div className="glass-card p-4">
              <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                 <div className="w-1 h-3 bg-blue-400 rounded-full"></div>
                 最近行程
              </h3>
              
              <div className="space-y-3">
                 {upcomingDates.length > 0 ? (
                   // ✨ 修改：slice(0, 5) -> slice(0, 4) 只顯示 4 個
                   upcomingDates.slice(0, 4).map(item => (
                     <div key={item.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors" onClick={() => handleOpenEdit(item)}>
                        
                        {/* 日期小方塊 */}
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-white/5 rounded-lg border border-white/5 shrink-0 group-hover:border-white/20 transition-colors">
                           <span className="text-[10px] text-slate-400 leading-none mb-0.5">
                             {new Date(item.date).getMonth() + 1}月
                           </span>
                           <span className="text-sm font-bold text-white leading-none">
                             {new Date(item.date).getDate()}
                           </span>
                        </div>
                        
                        {/* 文字資訊 */}
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                {item.title}
                              </p>
                              {/* 倒數天數 Badge */}
                              <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                {Math.ceil((new Date(item.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))}天
                              </span>
                           </div>
                           
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", 
                                 item.category === '洗牙' ? 'bg-blue-400' :
                                 item.category === '剪頭髮' ? 'bg-orange-400' :
                                 item.category === '阿弟排班' ? 'bg-green-400' : 'bg-pink-500'
                              )}></span>
                              <span className="text-xs text-slate-500 truncate">
                                {item.time} · {item.category}
                              </span>
                           </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                     <p className="text-xs">目前無近期行程</p>
                   </div>
                 )}
                 
                 {/* 提示剩餘數量 (大於 4 個才顯示) */}
                 {upcomingDates.length > 4 && (
                    <div className="pt-2 border-t border-white/5 text-center">
                       <span className="text-[10px] text-slate-600">
                          還有 {upcomingDates.length - 4} 個行程...
                       </span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* --- 右側欄位 (9等份)：月曆 --- */}
        <div className="md:col-span-9">
           <CalendarWidget 
              events={dates} 
              onSelectDate={(date) => console.log("Selected", date)}
              onDelete={deleteDate}
              onEdit={handleOpenEdit}
           />
        </div>

      </div>

      <AddDateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
        initialData={editingDate}
      />
    </div>
  );
}