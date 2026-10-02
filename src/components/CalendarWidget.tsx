'use client';

import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RotateCw, Plus, CheckSquare, Square, Trash2, X, Maximize2, Minimize2, Copy, Download } from 'lucide-react';
import clsx from 'clsx';
import { DateItem } from '@/types';
import DateCard from '@/components/DateManager/DateCard';
import { CategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';
import { createCalendarImage, downloadCalendarImage } from './calendarImage';

interface CalendarWidgetProps {
  isExpanded?: boolean;
  onExpandedToggle?: () => void;
  events: DateItem[];
  onAddEvent?: (date: Date) => void; // 點擊新增按鈕時觸發
  onDelete: (id: string) => void;
  onEdit: (item: DateItem) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  batchMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onBatchModeToggle?: () => void;
  onBatchDelete?: () => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  onDuplicateDate?: (sourceId: string, targetDate: string) => void;
  onBatchAddRequest?: (dates: Date[]) => void;
  categoryColors: CategoryColorMap;
}

// ====================================================================
// DayCell：月曆中的單一日期格子
//
// 為何獨立成元件 + React.memo？
// - 月曆有 35~42 個格子，每次父元件 re-render（例如：選擇日期、
//   切換 Ctrl 鍵狀態）都會重算所有格子的 clsx/isSameDay 等邏輯
// - 用 memo + 自訂比較函式，只在真正影響外觀的 props 改變時才重繪
// ====================================================================
interface DayCellProps {
  isExpanded: boolean;
  day: Date;
  events: DateItem[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isTodayDate: boolean;
  isMultiSelected: boolean;
  isDragActive: boolean;
  showAddButton: boolean;
  onDayClick: (day: Date) => void;
  onAddClick: (e: React.MouseEvent, day: Date) => void;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, day: Date) => void;
  onDragEnd: () => void;
  categoryColors: CategoryColorMap;
}

const DayCell = memo(function DayCell({
  isExpanded,
  day,
  events,
  isCurrentMonth,
  isSelected,
  isTodayDate,
  isMultiSelected,
  isDragActive,
  showAddButton,
  onDayClick,
  onAddClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  categoryColors,
}: DayCellProps) {
  const dateLabel = format(day, 'd');

  return (
    <div
      onClick={() => onDayClick(day)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, day)}
      className={clsx(
        'relative flex flex-col cursor-pointer transition-colors duration-200 motion-reduce:transition-none p-1 md:p-2 group',
        isExpanded ? 'min-h-[140px] md:min-h-[150px]' : 'aspect-square min-h-[44px] md:aspect-auto md:min-h-[110px]',
        !isCurrentMonth ? 'bg-[#dcd0c2]/20 text-[#3d3a36]' : 'bg-transparent hover:bg-[#b87e6b]/5',
        isSelected && 'bg-[#b87e6b]/10 ring-1 ring-inset ring-[#b87e6b]',
        isTodayDate && !isSelected && 'bg-[#5f7186]/5',
        isMultiSelected && 'ring-2 ring-[#5f7186] bg-[#5f7186]/10',
        isDragActive && 'hover:ring-2 hover:ring-[#5f7186] hover:bg-[#5f7186]/5',
      )}
    >
      {/* 日期數字 + 桌面版新增按鈕 */}
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span
          className={clsx(
            'text-xs font-medium block text-center md:text-left',
            isTodayDate ? 'text-blue-400 font-bold' : 'text-[#3d3a36]',
            // 選取狀態用主色調鐵鏽紅，在淺色背景下保持可見
            isSelected && 'text-[#b87e6b] font-bold',
            !isCurrentMonth && 'opacity-50',
          )}
        >
          {dateLabel}
        </span>

        {/* 新增按鈕 - 桌面版 hover 時才顯示 */}
        {showAddButton && isCurrentMonth && (
          <button
            onClick={(e) => onAddClick(e, day)}
            className={clsx('w-5 h-5 items-center justify-center rounded bg-[#5f7186] hover:bg-[#47576b] text-[#f0ece1] transition-opacity duration-200 shadow-[0_2px_8px_rgba(139,121,101,0.04)]', isExpanded ? 'flex md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100' : 'hidden md:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
            title={`新增 ${format(day, 'M/d')} 的行程`}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* 手機版：圓點指示器 */}
      <div className={clsx('gap-0.5 justify-center flex-wrap content-start md:hidden flex-1', isExpanded ? 'hidden' : 'flex')}>
        {events.slice(0, 4).map((event, idx) => (
          <div
            key={idx}
            className="rounded-full w-1.5 h-1.5"
            style={getCategoryColorStyles(event.category, categoryColors).dot}
          />
        ))}
      </div>

      {/* 手機版：選中日期後顯示新增按鈕 */}
      {showAddButton && isCurrentMonth && isSelected && !isExpanded && (
        <button
          onClick={(e) => onAddClick(e, day)}
          className="md:hidden absolute bottom-1 right-1 w-4 h-4 flex items-center justify-center rounded bg-[#5f7186] text-[#f0ece1] shadow-[0_2px_8px_rgba(139,121,101,0.04)]"
        >
          <Plus size={10} />
        </button>
      )}

      {/* 桌面版：行程標籤（最多 3 個，可拖曳複製） */}
      <div className={clsx('flex-col gap-1.5 w-full min-w-0', isExpanded ? 'flex max-h-64 overflow-y-auto custom-scrollbar' : 'hidden md:flex overflow-hidden')}>
        {(isExpanded ? events : events.slice(0, 3)).map((event) => (
          <div
            key={event.id}
            draggable
            onDragStart={(e) => onDragStart(e, event.id)}
            onDragEnd={onDragEnd}
            className={clsx(
              'text-xs font-bold px-2 py-1 rounded border-2 border-dashed shadow-[0_2px_8px_rgba(139,121,101,0.04)] cursor-move shrink-0',
              isExpanded ? 'whitespace-normal break-words leading-relaxed' : 'truncate',
              'hover:opacity-80 active:opacity-60 transition-opacity',
            )}
            style={getCategoryColorStyles(event.category, categoryColors).event}
            title={`${event.title} - 拖曳以複製到其他日期`}
            aria-label={`拖曳 ${event.title} 以複製到其他日期`}
          >
            {event.title}
            {isExpanded && (event.startTime || event.endTime) && (
              <span className="block text-[11px] font-medium opacity-90 tabular-nums">
                {[event.startTime, event.endTime].filter(Boolean).join('–')}
              </span>
            )}
          </div>
        ))}
        {!isExpanded && events.length > 3 && (
          <span className="text-[11px] font-medium text-[#3d3a36] pl-1">
            還有 {events.length - 3} 個...
          </span>
        )}
      </div>
    </div>
  );
},
// 自訂比較函式：只有真正影響外觀的 props 改變時才重繪
// 這讓「選擇其他日期」時只更新前後兩個格子，而非全部 35+ 個
(prev, next) =>
  prev.isExpanded === next.isExpanded &&
  prev.isSelected === next.isSelected &&
  prev.isTodayDate === next.isTodayDate &&
  prev.isMultiSelected === next.isMultiSelected &&
  prev.isDragActive === next.isDragActive &&
  prev.isCurrentMonth === next.isCurrentMonth &&
  prev.events.length === next.events.length &&
  prev.events === next.events &&
  prev.categoryColors === next.categoryColors
);

export default function CalendarWidget({ 
  isExpanded = false,
  onExpandedToggle,
  events, 
  onAddEvent, 
  onDelete, 
  onEdit, 
  onRefresh, 
  isRefreshing,
  batchMode = false,
  selectedIds = [],
  onToggleSelect,
  onBatchModeToggle,
  onBatchDelete,
  onSelectAll,
  allSelected = false,
  onDuplicateDate,
  onBatchAddRequest,
  categoryColors,
}: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 5;
  
  // 拖曳相關狀態
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  
  // Ctrl+多選相關狀態
  const [selectedEmptyDates, setSelectedEmptyDates] = useState<Date[]>([]);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // 鍵盤事件監聽（Ctrl 鍵和 Esc 鍵）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
      if (e.key === 'Escape') {
        setSelectedEmptyDates([]);
        setIsCtrlPressed(false);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // eventsByDate 必須在 handleDayClick 之前定義，因為後者依賴它
  // 使用 HashMap 做 O(1) 查詢，避免在每個格子 render 時都 filter 整個 events 陣列
  const eventsByDate = useMemo(() => {
    const groups: Record<string, DateItem[]> = {};
    events.forEach(event => {
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [events]);

  const handleExport = async (copy: boolean) => {
    if (isExporting) return;
    setIsExporting(true);
    const imagePromise = createCalendarImage(currentMonth, days, eventsByDate, categoryColors);
    try {
      if (copy && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          // 在點擊當下交付圖片 Promise，避免產圖完成後失去瀏覽器的使用者操作授權。
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': imagePromise })]);
          toast.success('已複製月曆圖片');
          return;
        } catch {
          downloadCalendarImage(await imagePromise, currentMonth);
          toast('無法複製圖片，已改為下載 PNG');
          return;
        }
      }
      downloadCalendarImage(await imagePromise, currentMonth);
      toast.success(copy ? '瀏覽器不支援複製圖片，已下載 PNG' : '已下載月曆圖片');
    } catch (error) {
      console.error('月曆圖片產生失敗:', error);
      toast.error('無法產生月曆圖片，請再試一次');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDayClick = useCallback((day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || [];
    
    // 如果按住 Ctrl 且該日期無行程，加入/移除多選
    if (isCtrlPressed && dayEvents.length === 0) {
      setSelectedEmptyDates(prev => {
        const exists = prev.some(d => format(d, 'yyyy-MM-dd') === dateKey);
        if (exists) {
          // 取消選擇
          return prev.filter(d => format(d, 'yyyy-MM-dd') !== dateKey);
        } else {
          // 加入選擇
          return [...prev, day];
        }
      });
    } else {
      // 原有邏輯：切換選定日期
      setSelectedDate(day);
      setCurrentPage(1); // 切換日期時重置到第一頁
    }
  }, [eventsByDate, isCtrlPressed]);

  // 點擊新增按鈕（useCallback 確保傳入 DayCell 的引用穩定，避免 memo 失效）
  const handleAddClick = useCallback((e: React.MouseEvent, day: Date) => {
    e.stopPropagation(); // 防止觸發日期格子的點擊
    if (onAddEvent) onAddEvent(day);
  }, [onAddEvent]);

  // 拖曳處理函式（全部 useCallback，避免 DayCell memo 失效）
  const handleDragStart = useCallback((e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'copy';
    
    // 設定拖曳預覽文字
    const dragEvent = events.find(ev => ev.id === eventId);
    if (dragEvent) {
      e.dataTransfer.setData('text/plain', dragEvent.title);
    }
  }, [events]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    
    if (!draggedEventId || !onDuplicateDate) return;
    
    // 格式化目標日期（使用本地時區避免 UTC 偏移）
    const year = targetDay.getFullYear();
    const month = String(targetDay.getMonth() + 1).padStart(2, '0');
    const day = String(targetDay.getDate()).padStart(2, '0');
    const targetDateString = `${year}-${month}-${day}`;
    
    onDuplicateDate(draggedEventId, targetDateString);
    setDraggedEventId(null);
  }, [draggedEventId, onDuplicateDate]);

  const handleDragEnd = useCallback(() => {
    setDraggedEventId(null);
  }, []);

  // 批次新增處理
  const handleBatchAdd = () => {
    if (selectedEmptyDates.length === 0) return;
    if (onBatchAddRequest) {
      onBatchAddRequest(selectedEmptyDates);
    }
  };

  const handleCancelBatchSelect = () => {
    setSelectedEmptyDates([]);
  };

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  // 分頁計算
  const totalPages = Math.ceil(selectedDayEvents.length / itemsPerPage);
  const paginatedEvents = selectedDayEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="glass-card p-4 md:p-6 select-none h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6 shrink-0">
        
        {/* ✨ 修改這裡：將標題和重整按鈕包在一起 */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-[#3d3a36] tracking-wide whitespace-nowrap">
            {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
          </h2>
          {onRefresh && (
             <button 
               onClick={onRefresh}
               disabled={isRefreshing}
               className="p-1.5 rounded-full hover:bg-[#dcd0c2]/50 text-[#3d3a36] hover:text-[#b87e6b] transition-all duration-200 disabled:opacity-50"
               title="重新整理資料"
             >
               <RotateCw 
                 size={18} 
                 className={clsx("transition-all duration-700", isRefreshing && "animate-spin")} 
               />
             </button>
           )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
           {isExpanded && <>
             <button onClick={() => handleExport(true)} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#b87e6b] text-[#f0ece1] text-xs font-bold disabled:opacity-50">
               <Copy size={16} />{isExporting ? '產生圖片中…' : '複製圖片'}
             </button>
             <button onClick={() => handleExport(false)} disabled={isExporting} aria-label="下載月曆圖片" title="下載 PNG" className="p-2 rounded-full hover:bg-[#dcd0c2]/50 text-[#3d3a36] disabled:opacity-50"><Download size={18} /></button>
           </>}
           {onExpandedToggle && (
             <button
               type="button"
               onClick={onExpandedToggle}
               aria-label={isExpanded ? '收合月曆' : '展開月曆'}
               aria-expanded={isExpanded}
               aria-controls="overview-calendar"
               title={isExpanded ? '收合月曆（Esc）' : '展開月曆'}
               className="p-1.5 md:p-2 hover:bg-[#dcd0c2]/50 rounded-full text-[#3d3a36] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b87e6b]"
             >
               {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
             </button>
           )}
           <button onClick={prevMonth} aria-label="上個月" className="p-1.5 md:p-2 hover:bg-[#dcd0c2]/50 rounded-full text-[#3d3a36] transition-all duration-200">
             <ChevronLeft size={20} />
           </button>
           <button onClick={nextMonth} aria-label="下個月" className="p-1.5 md:p-2 hover:bg-[#dcd0c2]/50 rounded-full text-[#3d3a36] transition-all duration-200">
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* 批次操作工具列 */}
      {onBatchModeToggle && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-[#dcd0c2]/50 shrink-0">
          <button
            onClick={onBatchModeToggle}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              batchMode 
                ? "bg-[#5f7186] text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-purple-500/30" 
                : "bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 text-[#3d3a36]"
            )}
            aria-label="批次選擇模式"
            aria-pressed={batchMode}
          >
            {batchMode ? <CheckSquare size={14} /> : <Square size={14} />}
            {batchMode ? '離開批次' : '批次操作'}
          </button>
          
          {batchMode && (
            <div className="flex items-center gap-2">
              {onSelectAll && (
                <button
                  onClick={onSelectAll}
                  className="px-2 py-1 text-[10px] bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded text-[#3d3a36] transition-all duration-200"
                  aria-label="全選/取消全選"
                >
                  {allSelected ? '取消全選' : '全選'}
                </button>
              )}
              
              {selectedIds.length > 0 && onBatchDelete && (
                <button
                  onClick={onBatchDelete}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[#b87e6b]/20 hover:bg-[#b87e6b]/20 text-[#b87e6b] rounded transition-all duration-200"
                  aria-label={`刪除選取的 ${selectedIds.length} 個項目`}
                >
                  <Trash2 size={12} />
                  刪除 ({selectedIds.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ctrl+多選批次新增工具列 */}
      {selectedEmptyDates.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-[#dcd0c2]/50 bg-[#5f7186]/10 px-4 py-2 rounded-lg shrink-0 animate-scale-in">
          <span className="text-sm text-[#5f7186] font-medium">
            已選擇 {selectedEmptyDates.length} 個日期
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchAdd}
              className="px-3 py-1.5 bg-[#5f7186] hover:bg-[#5f7186] text-[#f0ece1] text-sm font-medium rounded-lg transition-all duration-200 shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-purple-500/30"
            >
              執行批次新增
            </button>
            <button
              onClick={handleCancelBatchSelect}
              className="p-1.5 hover:bg-[#dcd0c2]/50 text-[#3d3a36] hover:text-[#b87e6b] rounded-lg transition-all duration-200"
              aria-label="取消多選"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Week Days */}
      {isExpanded && <p className="md:hidden text-xs text-[#5f7186] mb-2">左右滑動查看日期</p>}
      <div className="overflow-x-auto min-w-0">
      <div className={clsx(isExpanded && 'min-w-[875px] md:min-w-0')}>
      <div className="grid grid-cols-7 mb-2 text-center shrink-0 border-b border-dashed border-[#dcd0c2]/50 pb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs md:text-sm font-bold text-[#3d3a36]">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px md:gap-1 bg-[#dcd0c2]/30 rounded-lg overflow-hidden border-2 border-dashed border-[#dcd0c2]/50 shrink-0">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];

          return (
            <DayCell
              key={dateKey}
              isExpanded={isExpanded}
              day={day}
              events={dayEvents}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              isSelected={isSameDay(day, selectedDate)}
              isTodayDate={isToday(day)}
              isMultiSelected={selectedEmptyDates.some(d => format(d, 'yyyy-MM-dd') === dateKey)}
              isDragActive={!!draggedEventId}
              showAddButton={!!onAddEvent}
              onDayClick={handleDayClick}
              onAddClick={handleAddClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              categoryColors={categoryColors}
            />
          );
        })}
      </div>

      </div>
      </div>
      {/* Selected Date Details */}
      <div className="mt-4 pt-4 border-t border-dashed border-[#dcd0c2]/50 flex-1 flex flex-col min-h-0">
         <h3 className="text-sm font-bold text-[#3d3a36] mb-3 flex items-center gap-2 shrink-0">
            <span className="w-1 h-4 bg-[#5f7186] rounded-full"></span>
            {format(selectedDate, 'M月d日')} 的行程 ({selectedDayEvents.length})
         </h3>
         
         <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {selectedDayEvents.length > 0 ? (
              paginatedEvents.map(event => (
                <DateCard 
                  key={event.id}
                  item={event}
                  onDelete={onDelete}
                  onEdit={() => onEdit(event)}
                  batchMode={batchMode}
                  isSelected={selectedIds.includes(event.id)}
                  onToggleSelect={onToggleSelect}
                  categoryColors={categoryColors}
                />
              ))
            ) : (
              <div className="h-full max-h-32 flex items-center justify-center border-2 border-dashed border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl bg-white/[0.02]">
                <p className="text-[#3d3a36] text-sm">本日無行程，好好休息吧！😴</p>
              </div>
            )}
         </div>
         
         {/* Pagination Controls */}
         {totalPages > 1 && (
           <div className="mt-4 pt-3 border-t border-dashed border-[#dcd0c2]/50 flex items-center justify-between shrink-0">
             <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="px-3 py-1.5 text-xs bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-[#3d3a36] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
               aria-label="上一頁"
             >
               <ChevronLeft size={14} />
               上一頁
             </button>
             
             <span className="text-xs text-[#3d3a36]">
               第 <span className="text-[#5f7186] font-bold">{currentPage}</span> / {totalPages} 頁
             </span>
             
             <button
               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
               disabled={currentPage === totalPages}
               className="px-3 py-1.5 text-xs bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-[#3d3a36] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
               aria-label="下一頁"
             >
               下一頁
               <ChevronRight size={14} />
             </button>
           </div>
         )}
      </div>
    </div>
  );
}
