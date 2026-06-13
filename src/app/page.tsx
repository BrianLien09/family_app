'use client';

// 1. 引入 useEffect
import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useDates } from '@/hooks/useDates';
import CalendarWidget from '@/components/CalendarWidget';
import AddDateModal from '@/components/DateManager/AddDateModal';
import { Plus, Calendar, Search, Filter, X, CalendarClock, History, ChevronDown } from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import clsx from 'clsx';
// 2. 引入 toast 和 auth
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { dates, addDate, deleteDate, deleteDates, updateDate, duplicateDate, addDateToMultipleDates, isLoaded, refresh, isRefreshing } = useDates();
  const { categories } = useCategories();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<DateItem | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);
  
  // 新增：搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<DateCategory[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 新增：快速預覽狀態
  const [quickPreviewDate, setQuickPreviewDate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'upcoming' | 'past' | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  // 新增：批次選擇狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  
  // 新增：批次新增到多個日期的狀態
  const [batchAddDates, setBatchAddDates] = useState<string[]>([]);
  
  // 篩選後的行程
  const filteredDates = useMemo(() => {
    return dates.filter(item => {
      // 搜尋關鍵字
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 分類篩選
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(item.category);
      
      // 日期區間篩選
      let matchesDateRange = true;
      if (dateRangeStart && dateRangeEnd) {
        const itemDate = new Date(item.date).getTime();
        const startDate = new Date(dateRangeStart).getTime();
        const endDate = new Date(dateRangeEnd).getTime();
        matchesDateRange = itemDate >= startDate && itemDate <= endDate;
      }
      
      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [dates, searchTerm, selectedCategories, dateRangeStart, dateRangeEnd]);
  
  // 切換分類選擇
  const toggleCategory = (category: DateCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // 清除所有篩選
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setDateRangeStart('');
    setDateRangeEnd('');
  };
  
  // 快速跳到最近的行程
  const jumpToUpcoming = () => {
    if (upcomingDates.length === 0) {
      toast('目前沒有即將到來的行程', { icon: '📅' });
      return;
    }
    
    // 設定為預覽即將到來的行程
    setPreviewMode('upcoming');
    setPreviewIndex(0);
    setQuickPreviewDate('upcoming');
    
    // 顯示提示
    const nextEvent = upcomingDates[0];
    const displayDate = new Date(nextEvent.date).toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    toast.success(`最近的行程：${displayDate} - ${nextEvent.title}`, { duration: 4000 });
  };
  
  // 快速回顧過往行程
  const jumpToPast = () => {
    if (pastDates.length === 0) {
      toast('目前沒有過往行程', { icon: '📚' });
      return;
    }
    
    // 設定為預覽過往行程
    setPreviewMode('past');
    setPreviewIndex(0);
    setQuickPreviewDate('past');
    
    // 顯示提示
    const lastEvent = pastDates[0];
    const displayDate = new Date(lastEvent.date).toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    toast.success(`最近完成的行程：${displayDate} - ${lastEvent.title}`, { duration: 4000 });
  };
  
  // 批次操作函式
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDates.map(d => d.id));
    }
  };
  
  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('請先選擇要刪除的行程');
      return;
    }
    
    if (confirm(`確定要刪除 ${selectedIds.length} 個行程嗎？`)) {
      deleteDates(selectedIds);
      setSelectedIds([]);
      setBatchMode(false);
    }
  };
  
  // 計算即將到來的行程（使用篩選後的資料）
  const upcomingDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return filteredDates
      .filter(d => new Date(d.date).getTime() >= todayStart)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredDates]);
  
  // 計算過往的行程（使用篩選後的資料）
  const pastDates = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return filteredDates
      .filter(d => new Date(d.date).getTime() < todayStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 由近到遠排序
  }, [filteredDates]);

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

  const handleModalSubmit = (data: Omit<DateItem, 'id'>) => {
    if (editingDate) {
      updateDate(editingDate.id, data);
    } else if (batchAddDates.length > 0) {
      // 批次新增模式
      addDateToMultipleDates(batchAddDates, data);
      setBatchAddDates([]);
    } else {
      addDate({ ...data, id: '' });
    }
    setIsModalOpen(false);
    setEditingDate(null);
  };

  // 拖曳複製行程處理
  const handleDuplicateDate = (sourceId: string, targetDate: string) => {
    duplicateDate(sourceId, targetDate);
  };

  // 批次新增請求處理
  const handleBatchAddRequest = (dates: Date[]) => {
    const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));
    setBatchAddDates(dateStrings);
    setIsModalOpen(true);
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-[#3d3a36]">載入中...</div>;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 max-w-5xl">
      {/* 搜尋與篩選區 */}
      <div className="glass-card p-4 mb-6">
        {/* 搜尋欄 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d3a36]" size={20} />
          <input
            type="text"
            placeholder="搜尋行程標題或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#f0ece1] placeholder:text-[#3d3a36] focus:outline-none focus:border-[#b87e6b]/50 transition-all"
            aria-label="搜尋行程"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200"
              aria-label="清除搜尋"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* 篩選按鈕 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-sm text-[#3d3a36] transition-all duration-200"
              aria-label="切換篩選器"
            >
              <Filter size={16} />
              篩選 {(selectedCategories.length > 0 || dateRangeStart || dateRangeEnd) && `(${selectedCategories.length + (dateRangeStart ? 1 : 0)})`}
            </button>
            
            <button
              onClick={jumpToUpcoming}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5f7186]/10 to-[#5f7186]/10 hover:from-[#5f7186]/20 hover:to-[#5f7186]/20 border-2 border-dashed border-[#5f7186]/30 rounded-lg text-sm text-[#5f7186] font-medium transition-all hover:shadow-[0_8px_20px_rgba(139,121,101,0.08)] hover:shadow-[#5f7186]/20"
              aria-label="跳到最近行程"
              title="快速找到最接近今天的行程"
            >
              <CalendarClock size={16} />
              <span className="hidden sm:inline">即將到來</span>
              <span className="sm:hidden">最近</span>
            </button>
            
            <button
              onClick={jumpToPast}
              className="flex items-center gap-2 px-4 py-2 bg-[#b87e6b]/20 hover:bg-[#b87e6b]/30 border-2 border-dashed border-[#b87e6b]/50 rounded-lg text-sm text-[#b87e6b] font-medium transition-all hover:shadow-[0_8px_20px_rgba(139,121,101,0.08)] hover:shadow-[#b87e6b]/20"
              aria-label="回顧過往行程"
              title="快速查看最近完成的行程"
            >
              <History size={16} />
              <span className="hidden sm:inline">回顧過往</span>
              <span className="sm:hidden">過往</span>
            </button>
          </div>
          
          {(searchTerm || selectedCategories.length > 0 || dateRangeStart || dateRangeEnd) && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200 self-end sm:self-auto"
            >
              清除所有篩選
            </button>
          )}
        </div>

        {/* 篩選選項 */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-dashed border-[#dcd0c2]/50">
            {/* 分類多選 */}
            <div>
              <label className="text-xs font-bold text-[#3d3a36] mb-2 block">分類</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category: string) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      selectedCategories.includes(category)
                        ? "bg-[#5f7186] text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-purple-500/30"
                        : "bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50"
                    )}
                    aria-label={`篩選 ${category}`}
                    aria-pressed={selectedCategories.includes(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 日期區間 */}
            <div>
              <label className="text-xs font-bold text-[#3d3a36] mb-2 block">日期區間</label>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-lg text-[#f0ece1] text-sm focus:outline-none focus:border-[#b87e6b]/50 transition-all"
                  aria-label="開始日期"
                />
                <span className="text-[#3d3a36]">至</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-lg text-[#f0ece1] text-sm focus:outline-none focus:border-[#b87e6b]/50 transition-all"
                  aria-label="結束日期"
                />
              </div>
            </div>
          </div>
        )}

        {/* 篩選結果提示 */}
        {(searchTerm || selectedCategories.length > 0 || dateRangeStart || dateRangeEnd) && (
          <div className="mt-4 text-xs text-[#3d3a36]">
            找到 <span className="text-[#5f7186] font-bold">{filteredDates.length}</span> 個符合條件的行程
          </div>
        )}
      </div>

      {/* 快速預覽卡片 */}
      {quickPreviewDate && previewMode && (() => {
        const eventsList = previewMode === 'upcoming' ? upcomingDates : pastDates;
        const currentEvent = eventsList[previewIndex];
        
        if (!currentEvent) return null;
        
        const previewDate = new Date(currentEvent.date);
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        
        return (
          <div className="glass-card p-5 mb-6 animate-scale-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx(
                    "px-2 py-1 rounded text-xs font-medium",
                    previewMode === 'upcoming' 
                      ? "bg-[#5f7186]/10 text-[#5f7186] border-dashed border-[#5f7186]/30"
                      : "bg-[#b87e6b]/10 text-[#b87e6b] border-dashed border-[#b87e6b]/30"
                  )}>
                    {previewMode === 'upcoming' ? '即將到來' : '回顧過往'}
                  </span>
                  {eventsList.length > 1 && (
                    <span className="text-xs text-[#3d3a36]">
                      ({previewIndex + 1}/{eventsList.length})
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#f0ece1] mb-1">
                  {previewDate.toLocaleDateString('zh-TW', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} {weekdays[previewDate.getDay()]}
                </h3>
              </div>
              <button
                onClick={() => {
                  setQuickPreviewDate(null);
                  setPreviewMode(null);
                  setPreviewIndex(0);
                }}
                className="text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200"
                aria-label="關閉預覽"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* 下拉選單 - 選擇要查看的行程 */}
            {eventsList.length > 1 && (
              <div className="mb-4">
                <label className="text-xs text-[#3d3a36] mb-2 block">選擇行程</label>
                <div className="relative">
                  <select
                    value={previewIndex}
                    onChange={(e) => setPreviewIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 pr-8 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-lg text-[#f0ece1] text-sm focus:outline-none focus:border-[#b87e6b]/50 transition-all appearance-none cursor-pointer"
                  >
                    {eventsList.map((event, index) => {
                      const eventDate = new Date(event.date);
                      const formattedDate = eventDate.toLocaleDateString('zh-TW', { 
                        month: 'numeric', 
                        day: 'numeric' 
                      });
                      return (
                        <option key={event.id} value={index} className="bg-[#f0ece1]">
                          {formattedDate} - {event.title} {event.startTime && `(${event.startTime})`}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d3a36] pointer-events-none" size={16} />
                </div>
              </div>
            )}
            
            {/* 當前行程詳情 */}
            <div className="mb-4">
              <div className="flex items-start gap-3 p-4 bg-[#dcd0c2]/30 rounded-lg">
                <div className="flex flex-col items-center justify-center min-w-[56px] h-14 bg-gradient-to-br from-[#5f7186]/10 to-[#5f7186]/10 rounded-lg border-2 border-dashed border-[#5f7186]/30">
                  <span className="text-xs text-[#5f7186] leading-none mb-1">{previewDate.getMonth() + 1}月</span>
                  <span className="text-xl font-bold text-[#f0ece1] leading-none">{previewDate.getDate()}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-base font-bold text-[#f0ece1]">{currentEvent.title}</h4>
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-medium shrink-0",
                      currentEvent.category === '洗牙' ? 'bg-[#5f7186]/10 text-[#5f7186] border-dashed border-[#5f7186]/30' :
                      currentEvent.category === '剪頭髮' ? 'bg-[#b87e6b]/10 text-[#b87e6b] border-dashed border-[#b87e6b]/30' :
                      currentEvent.category === '阿弟排班' ? 'bg-[#9c9c9c]/15 text-[#3d3a36] border-dashed border-[#9c9c9c]/40' : 
                      currentEvent.category === '孔呆值班' ? 'bg-[#d4c5b0]/20 text-[#8c7457] border-dashed border-[#d4c5b0]/50' :
                      currentEvent.category === '繳費' ? 'bg-[#78716c]/10 text-[#3d3a36] border-dashed border-[#78716c]/30' : 
                      'bg-[#3d3a36]/5 text-[#3d3a36]/70 border-dashed border-[#3d3a36]/20'
                    )}>
                      {currentEvent.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-[#3d3a36] mb-2">
                    {currentEvent.startTime && (
                      <span className="text-[#5f7186] font-medium">
                        {currentEvent.startTime}
                        {currentEvent.endTime && ` ~ ${currentEvent.endTime}`}
                      </span>
                    )}
                  </p>
                  
                  {currentEvent.description && (
                    <p className="text-sm text-[#3d3a36] bg-[#dcd0c2]/30 p-2 rounded border-2 border-dashed border-dashed border-[#dcd0c2]/50">
                      {currentEvent.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQuickPreviewDate(null);
                  setPreviewMode(null);
                  setPreviewIndex(0);
                  // 滾動到月曆區域
                  const calendarSection = document.querySelector('.md\\:col-span-9');
                  if (calendarSection) {
                    calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5f7186]/10 to-[#5f7186]/10 hover:from-[#5f7186]/20 hover:to-[#5f7186]/20 border-2 border-dashed border-[#5f7186]/30 rounded-lg text-sm text-[#5f7186] font-medium transition-all hover:shadow-[0_8px_20px_rgba(139,121,101,0.08)] hover:shadow-[#5f7186]/20"
              >
                在月曆中查看
              </button>
              <button
                onClick={() => {
                  setQuickPreviewDate(null);
                  setPreviewMode(null);
                  setPreviewIndex(0);
                }}
                className="px-4 py-2 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-sm text-[#3d3a36] transition-all duration-200"
              >
                關閉
              </button>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* 左側欄位 */}
        <div className="md:col-span-3 flex flex-col gap-6">
           {/* 日期卡片 */}
           <div className="glass-card flex flex-col items-center justify-center text-center py-8 relative overflow-hidden group">
             {/* ... */}
             <div className="w-16 h-16 rounded-2xl bg-[#b87e6b] flex items-center justify-center shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#5f7186]/20 mb-4 rotate-3 group-hover:rotate-6 transition-transform">
                 <Calendar className="text-[#f0ece1] w-8 h-8" />
             </div>
             <h2 className="text-3xl font-bold text-[#3d3a36] mb-1">{new Date().getDate()}</h2>
             <p className="text-[#5f7186] uppercase tracking-widest text-xs font-semibold mb-6">
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
              <h3 className="text-xs font-bold text-[#3d3a36] mb-4 uppercase tracking-wider flex items-center gap-2">
                 <div className="w-1 h-3 bg-[#5f7186] rounded-full"></div>
                 最近行程
              </h3>
              <div className="space-y-3">
                 {upcomingDates.length > 0 ? (
                   upcomingDates.slice(0, 4).map(item => (
                     <div key={item.id} className="flex items-center gap-3 group cursor-pointer hover:bg-[#dcd0c2]/30 p-2 -mx-2 rounded-lg transition-all duration-200" onClick={() => handleOpenEdit(item)}>
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-[#dcd0c2]/30 rounded-lg border-2 border-dashed border-dashed border-[#dcd0c2]/50 shrink-0 group-hover:border-dashed border-[#dcd0c2]/50 transition-all duration-200">
                           <span className="text-[10px] text-[#3d3a36] leading-none mb-0.5">{new Date(item.date).getMonth() + 1}月</span>
                           <span className="text-sm font-bold text-[#b87e6b] leading-none">{new Date(item.date).getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-[#3d3a36] truncate group-hover:text-[#b87e6b] transition-all duration-200">{item.title}</p>
                              <span className="text-[10px] text-[#3d3a36] bg-[#dcd0c2]/30 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                {Math.ceil((new Date(item.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))}天
                              </span>
                           </div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", 
                                 item.category === '洗牙' ? 'bg-[#5f7186]' :
                                 item.category === '剪頭髮' ? 'bg-[#b87e6b]' :
                                 item.category === '阿弟排班' ? 'bg-[#6e8568]' : 
                                 item.category === '孔呆值班' ? 'bg-[#b8956b]' :
                                 item.category === '繳費' ? 'bg-[#78716c]' : 'bg-[#3d3a36]/70'
                              )}></span>
                              <span className="text-xs text-[#3d3a36] truncate">
                                {item.startTime && `${item.startTime} · `}{item.category}
                              </span>
                           </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="flex flex-col items-center justify-center py-8 text-[#3d3a36]"><p className="text-xs">目前無近期行程</p></div>
                 )}
                 {upcomingDates.length > 4 && (
                    <div className="pt-2 border-t border-dashed border-[#dcd0c2]/50 text-center">
                       <span className="text-[10px] text-[#78716c]">還有 {upcomingDates.length - 4} 個行程...</span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* 右側欄位 (月曆) - 使用篩選後的資料 */}
        <div className="md:col-span-9">
           <CalendarWidget 
               events={filteredDates} 
               onAddEvent={handleCalendarAddClick}
               onDelete={deleteDate}
               onEdit={handleOpenEdit}
               onRefresh={refresh}
               isRefreshing={isRefreshing}
               batchMode={batchMode}
               selectedIds={selectedIds}
               onToggleSelect={toggleSelectItem}
               onBatchModeToggle={() => {
                 setBatchMode(!batchMode);
                 setSelectedIds([]);
               }}
               onBatchDelete={handleBatchDelete}
               onSelectAll={toggleSelectAll}
               allSelected={selectedIds.length === filteredDates.length && filteredDates.length > 0}
               onDuplicateDate={handleDuplicateDate}
               onBatchAddRequest={handleBatchAddRequest}
            />
        </div>

      </div>

      <AddDateModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDateForNew(null);
          setBatchAddDates([]);
        }} 
        onSubmit={handleModalSubmit}
        initialData={editingDate}
        presetDate={selectedDateForNew}
      />
    </div>
  );
}