'use client';

// 1. 引入 useEffect
import { useState, useMemo, useEffect } from 'react';
import { useDates } from '@/hooks/useDates';
import CalendarWidget from '@/components/CalendarWidget'; 
import AddDateModal from '@/components/DateManager/AddDateModal';
import { Plus, Calendar, Sparkles } from 'lucide-react';
import { DateItem } from '@/types';
import Login from '@/components/Login';
import clsx from 'clsx';
// 2. 引入 toast 和 auth
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { dates, addDate, deleteDate, updateDate, isLoaded, refresh, isRefreshing } = useDates();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<DateItem | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
  
  // ... (upcomingDates 邏輯保持不變) ...
  const upcomingDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return dates
      .filter(d => new Date(d.date).getTime() >= todayStart)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dates]);

  // ✨✨✨ 新增這段 useEffect ✨✨✨
  useEffect(() => {
    // 邏輯：當「讀取狀態完成 (isLoaded 為 true)」且「目前沒有登入使用者 (!auth.currentUser)」
    if (isLoaded && !auth.currentUser) {
      toast('歡迎！請先登入以儲存行程 🔒', {
        icon: '👋',
        duration: 5000, // 顯示 5 秒
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    }
  }, [isLoaded]); 
  // ✨✨✨ 結束 ✨✨✨

  const handleOpenAdd = (presetDate?: string) => {
    // 這裡也可以加一個防呆：如果沒登入，點擊按鈕也跳警告
    if (!auth.currentUser) {
        toast.error("請先登入才能新增行程喔！");
        return;
    }
    setEditingDate(null);
    setSelectedDateForNew(presetDate || null);
    setIsModalOpen(true);
  };

  // 點擊月曆日期格子的新增按鈕時，開啟新增行程 Modal
  const handleCalendarAddClick = (date: Date) => {
    // 使用本地時區格式化日期，避免 UTC 時區問題
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    handleOpenAdd(dateString);
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
      {/* ... 下面的 JSX 都不用動 ... */}
      
      {/* Hero Header */}
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
        
        {/* 左側欄位 */}
        <div className="md:col-span-3 flex flex-col gap-6">
           {/* 日期卡片 */}
           <div className="glass-card flex flex-col items-center justify-center text-center py-8 relative overflow-hidden group">
             {/* ... */}
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 group-hover:rotate-6 transition-transform">
                 <Calendar className="text-white w-8 h-8" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-1">{new Date().getDate()}</h2>
             <p className="text-blue-200 uppercase tracking-widest text-xs font-semibold mb-6">
                 {new Date().toLocaleString('zh-TW', { month: 'long' })}
             </p>
             {/* 修改按鈕事件：handleOpenAdd 裡面已經加了登入檢查 */}
              <button onClick={() => handleOpenAdd()} className="btn-primary w-full max-w-[180px] flex items-center justify-center gap-2 text-sm">
               <Plus size={18} /> 新增行程
             </button>
           </div>

           {/* 近期行程 */}
           <div className="glass-card p-4">
              {/* ... 近期行程內容保持不變 ... */}
              <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                 <div className="w-1 h-3 bg-blue-400 rounded-full"></div>
                 最近行程
              </h3>
              <div className="space-y-3">
                 {upcomingDates.length > 0 ? (
                   upcomingDates.slice(0, 4).map(item => (
                     <div key={item.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors" onClick={() => handleOpenEdit(item)}>
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-white/5 rounded-lg border border-white/5 shrink-0 group-hover:border-white/20 transition-colors">
                           <span className="text-[10px] text-slate-400 leading-none mb-0.5">{new Date(item.date).getMonth() + 1}月</span>
                           <span className="text-sm font-bold text-white leading-none">{new Date(item.date).getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.title}</p>
                              <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                {Math.ceil((new Date(item.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))}天
                              </span>
                           </div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", 
                                 item.category === '洗牙' ? 'bg-blue-400' :
                                 item.category === '剪頭髮' ? 'bg-orange-400' :
                                 item.category === '阿弟排班' ? 'bg-green-400' : 
                                 item.category === '孔呆值班' ? 'bg-cyan-400' :
                                 item.category === '繳費' ? 'bg-yellow-400' : 'bg-pink-500'
                              )}></span>
                              <span className="text-xs text-slate-500 truncate">{item.time} · {item.category}</span>
                           </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="flex flex-col items-center justify-center py-8 text-slate-500"><p className="text-xs">目前無近期行程</p></div>
                 )}
                 {upcomingDates.length > 4 && (
                    <div className="pt-2 border-t border-white/5 text-center">
                       <span className="text-[10px] text-slate-600">還有 {upcomingDates.length - 4} 個行程...</span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* 右側欄位 (月曆) */}
        <div className="md:col-span-9">
           <CalendarWidget 
               events={dates} 
               onAddEvent={handleCalendarAddClick}
               onDelete={deleteDate}
               onEdit={handleOpenEdit}
               onRefresh={refresh}
               isRefreshing={isRefreshing}
            />
        </div>

      </div>

      <AddDateModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDateForNew(null);
        }} 
        onSubmit={handleModalSubmit}
        initialData={editingDate}
        presetDate={selectedDateForNew}
      />
    </div>
  );
}