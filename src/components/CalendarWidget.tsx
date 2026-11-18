'use client';

import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { CalendarCheck, ChevronLeft, ChevronRight, RotateCw, Plus, CheckSquare, Square, Trash2, X, Copy, Download } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { collapse, popIn, slideX } from '@/lib/motion';
import FadeSwap from '@/components/ui/FadeSwap';
import Collapsible from '@/components/ui/Collapsible';
import { DateItem } from '@/types';
import DateCard from '@/components/DateManager/DateCard';
import { CategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';
import { createCalendarImage, downloadCalendarImage } from './calendarImage';

// 月份切換依方向水平滑動：格子面積大用 24px，標題文字小用 12px，兩者共用同一個方向與節奏
const monthVariants = slideX(24);
const monthTitleVariants = slideX(12);

interface CalendarWidgetProps {
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
      role="button"
      tabIndex={0}
      aria-current={isTodayDate ? 'date' : undefined}
      aria-pressed={isSelected}
      aria-label={`${isTodayDate ? '今天，' : ''}${format(day, 'M月d日')}，${events.length} 個行程`}
      onClick={() => onDayClick(day)}
      // 只處理格子本身的按鍵，避免攔截內部新增按鈕的 Enter／Space
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick(day); }
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, day)}
      className={clsx(
        'relative flex flex-col cursor-pointer transition-[color,background-color,box-shadow] duration-fast ease-out-expo motion-reduce:transition-none p-1 md:px-1.5 md:py-1 group',
        // 手機維持方格＋圓點；桌面不限制高度上限，讓完整標題換行呈現
        'aspect-square min-h-[44px] md:aspect-auto md:min-h-[88px]',
        !isCurrentMonth ? 'bg-[#dcd0c2]/20 text-[#3d3a36]' : 'bg-transparent hover:bg-[#b87e6b]/5',
        // 今天的底色比一般 hover 更明顯，但仍低於選取狀態，避免兩者同時出現時互相搶眼
        isTodayDate && !isSelected && 'bg-[#5f7186]/[0.08]',
        isSelected && 'bg-[#b87e6b]/10 ring-1 ring-inset ring-[#b87e6b]',
        isMultiSelected && 'ring-2 ring-[#5f7186] bg-[#5f7186]/10',
        isDragActive && 'hover:ring-2 hover:ring-[#5f7186] hover:bg-[#5f7186]/5',
      )}
    >
      {/* 今天：格子頂端的石板藍細條，在整張月曆掃過去時第一眼就能定位，不必逐格找數字 */}
      {isTodayDate && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-0 h-[3px] rounded-b-full bg-[#5f7186]" />
      )}

      {/* 日期數字 + 桌面版新增按鈕 */}
      <div className="flex items-center justify-center md:justify-between mb-0.5 shrink-0 gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={clsx(
              'inline-flex items-center justify-center rounded-full tabular-nums md:text-sm',
              // 今天用實心圓底＋外圈光暈：與選取狀態（鐵鏽色框線）是不同的視覺語言，兩者重疊時仍能分辨
              isTodayDate
                ? 'h-5 w-5 text-[11px] md:h-7 md:w-7 bg-[#5f7186] font-bold text-[#f0ece1] shadow-[0_2px_8px_rgba(95,113,134,0.35)] ring-2 ring-[#5f7186]/20 ring-offset-1 ring-offset-[#f0ece1]'
                : 'h-5 text-xs md:h-7 font-medium text-[#3d3a36]',
              // 選取狀態用主色調鐵鏽紅，在淺色背景下保持可見
              isSelected && !isTodayDate && 'text-[#b87e6b] font-bold',
              !isCurrentMonth && 'opacity-50',
            )}
          >
            {dateLabel}
          </span>
          {/* 桌面格子夠寬才補上文字標籤，手機只靠圓底與頂條，避免數字被擠到換行 */}
          {isTodayDate && (
            <span className="hidden md:inline text-[11px] font-bold tracking-wider text-[#5f7186]">今天</span>
          )}
        </span>

        {/* 新增按鈕 - 桌面版 hover 時才顯示 */}
        {showAddButton && isCurrentMonth && (
          <button
            onClick={(e) => onAddClick(e, day)}
            className="hidden md:flex w-6 h-6 items-center justify-center rounded bg-[#5f7186] hover:bg-[#47576b] text-[#f0ece1] transition-opacity duration-fast opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`新增 ${format(day, 'M/d')} 的行程`}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* 手機版：圓點指示器 */}
      <div className="flex gap-0.5 justify-center flex-wrap content-start md:hidden flex-1">
        {events.slice(0, 4).map((event, idx) => (
          <div
            key={idx}
            className="rounded-full w-1.5 h-1.5"
            style={getCategoryColorStyles(event.category, categoryColors).dot}
          />
        ))}
      </div>


      {/* 桌面版：顯示當日全部行程，標題完整換行不截斷（可拖曳複製） */}
      <div className="hidden md:flex flex-col gap-1 w-full min-w-0">
        {events.map((event) => (
          <div
            key={event.id}
            draggable
            onDragStart={(e) => onDragStart(e, event.id)}
            onDragEnd={onDragEnd}
            className="text-[13px] font-semibold px-1.5 py-0.5 rounded-md border border-dashed cursor-move shrink-0 whitespace-normal break-words leading-snug hover:opacity-80 active:opacity-60 transition-opacity"
            style={getCategoryColorStyles(event.category, categoryColors).event}
            title={`${event.title} - 拖曳以複製到其他日期`}
            aria-label={`拖曳 ${event.title} 以複製到其他日期`}
          >
            {/* 時間與標題同行以節省垂直空間；標題過長時才換行 */}
            {event.startTime && (
              <span className="mr-1 text-[11px] font-medium opacity-80 tabular-nums">{event.startTime}</span>
            )}
            {event.title}
          </div>
        ))}
      </div>
    </div>
  );
},
// 自訂比較函式：只有真正影響外觀的 props 改變時才重繪
// 這讓「選擇其他日期」時只更新前後兩個格子，而非全部 35+ 個
(prev, next) =>
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
  const [monthDirection, setMonthDirection] = useState<1 | -1>(1);
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

  const nextMonth = () => { setMonthDirection(1); setCurrentMonth(addMonths(currentMonth, 1)); };
  const prevMonth = () => { setMonthDirection(-1); setCurrentMonth(subMonths(currentMonth, 1)); };
  // 翻到其他月份後一鍵回到今天，方向依目前月份前後決定，滑動動畫才不會反向
  const goToToday = () => {
    const today = new Date();
    if (!isSameMonth(today, currentMonth)) setMonthDirection(today > currentMonth ? 1 : -1);
    setCurrentMonth(today);
    setSelectedDate(today);
    setCurrentPage(1);
  };
  const isViewingToday = isSameMonth(currentMonth, new Date()) && isToday(selectedDate);

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
    <div className="glass-card p-4 md:px-5 md:py-4 select-none h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-1">
          {/* 標題與下方格子同方向滑動，避免文字瞬間換字、格子卻還在滑的節奏落差 */}
          <h2 className="relative overflow-hidden text-lg md:text-2xl font-bold text-[#3d3a36] tracking-wide whitespace-nowrap" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false} custom={monthDirection}>
              <m.span
                key={format(currentMonth, 'yyyy-MM')}
                custom={monthDirection}
                variants={monthTitleVariants}
                initial="enter"
                animate="center"
                exit="leave"
                className="inline-block"
              >
                {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
              </m.span>
            </AnimatePresence>
          </h2>
          {onRefresh && (
            <IconButton aria-label="重新整理資料" onClick={onRefresh} disabled={isRefreshing}>
              <RotateCw size={18} className={clsx(isRefreshing && 'motion-safe:animate-spin')} />
            </IconButton>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Button variant="primary" size="sm" onClick={() => handleExport(true)} disabled={isExporting} className="mr-1">
            <Copy size={16} aria-hidden="true" /><FadeSwap as="span" swapKey={isExporting ? 'exporting' : 'idle'}>{isExporting ? '產生圖片中…' : '複製圖片'}</FadeSwap>
          </Button>
          <IconButton aria-label="下載月曆圖片" onClick={() => handleExport(false)} disabled={isExporting}><Download size={18} /></IconButton>
          <Button size="sm" variant="soft" onClick={goToToday} disabled={isViewingToday} className="ml-1">
            <CalendarCheck size={14} aria-hidden="true" />今天
          </Button>
          <IconButton aria-label="上個月" onClick={prevMonth}><ChevronLeft size={20} /></IconButton>
          <IconButton aria-label="下個月" onClick={nextMonth}><ChevronRight size={20} /></IconButton>
        </div>
      </div>

      {/* 批次操作工具列 */}
      {onBatchModeToggle && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed border-[#dcd0c2]/50 shrink-0">
          <Button size="sm" variant={batchMode ? 'secondary' : 'soft'} onClick={onBatchModeToggle} aria-pressed={batchMode}>
            {batchMode ? <CheckSquare size={14} aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}
            <FadeSwap as="span" swapKey={batchMode ? 'leave' : 'enter'}>{batchMode ? '離開批次' : '批次操作'}</FadeSwap>
          </Button>

          <AnimatePresence initial={false}>
          {batchMode && (
            <m.div key="batch-actions" variants={popIn} initial="hidden" animate="visible" exit="exit" className="flex items-center gap-2">
              {onSelectAll && (
                <Button size="sm" onClick={onSelectAll}>{allSelected ? '取消全選' : '全選'}</Button>
              )}
              {selectedIds.length > 0 && onBatchDelete && (
                <Button size="sm" variant="danger" onClick={onBatchDelete} aria-label={`刪除選取的 ${selectedIds.length} 個項目`}>
                  <Trash2 size={14} aria-hidden="true" />
                  刪除 ({selectedIds.length})
                </Button>
              )}
            </m.div>
          )}
          </AnimatePresence>
        </div>
      )}

      {/* Ctrl+多選批次新增工具列：用 AnimatePresence 讓出現與消失都有高度過渡，不會讓月曆瞬間跳動 */}
      <AnimatePresence initial={false}>
        {selectedEmptyDates.length > 0 && (
          <m.div variants={collapse} initial="hidden" animate="visible" exit="exit" className="shrink-0 overflow-hidden">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-[#5f7186]/10 px-4 py-2">
              <span className="text-sm font-medium text-[#5f7186]">已選擇 {selectedEmptyDates.length} 個日期</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleBatchAdd}>執行批次新增</Button>
                <IconButton aria-label="取消多選" onClick={handleCancelBatchSelect} className="h-9 w-9"><X size={18} /></IconButton>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Week Days */}
      <div className="min-w-0">
      <div className="grid grid-cols-7 mb-1 text-center shrink-0 border-b border-dashed border-[#dcd0c2]/50 pb-1.5">
        {weekDays.map(day => (
          <div key={day} className="text-xs md:text-sm font-bold text-[#3d3a36]">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid：切換月份時依方向滑動；以 grid 重疊讓新舊月份交疊，避免高度跳動 */}
      <div className="grid overflow-hidden rounded-lg">
        <AnimatePresence initial={false} custom={monthDirection}>
          <m.div
            key={format(currentMonth, 'yyyy-MM')}
            custom={monthDirection}
            variants={monthVariants}
            initial="enter"
            animate="center"
            exit="leave"
            className="col-start-1 row-start-1 grid grid-cols-7 gap-px bg-[#dcd0c2]/40 rounded-lg overflow-hidden border-2 border-dashed border-[#dcd0c2]/50"
          >
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateKey] || [];

              return (
                <DayCell
                  key={dateKey}
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
          </m.div>
        </AnimatePresence>
      </div>

      </div>
      {/* Selected Date Details */}
      <div className="mt-4 pt-4 border-t border-dashed border-[#dcd0c2]/50 flex-1 flex flex-col min-h-0">
         <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
         <h3 className="text-sm font-bold text-[#3d3a36] flex items-center gap-2">
            <span className="w-1 h-4 bg-[#5f7186] rounded-full"></span>
            <FadeSwap as="span" swapKey={`${format(selectedDate, 'yyyy-MM-dd')}-${selectedDayEvents.length}`} className="inline-flex items-center gap-2">
              {format(selectedDate, 'M月d日')} 的行程 ({selectedDayEvents.length})
              {isToday(selectedDate) && (
                <span className="rounded-full bg-[#5f7186] px-2 py-0.5 text-[11px] font-bold text-[#f0ece1]">今天</span>
              )}
            </FadeSwap>
         </h3>
         {/* 手機格子只有約 46px，格內再塞新增按鈕會蓋住「今天」圓底與行程圓點，改放在當日行程標題列 */}
         {onAddEvent && (
           <Button size="sm" variant="secondary" onClick={() => onAddEvent(selectedDate)} className="md:hidden" aria-label={`新增 ${format(selectedDate, 'M/d')} 的行程`}>
             <Plus size={14} aria-hidden="true" />新增
           </Button>
         )}
         </div>

         <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {/* 有行程↔無行程交叉淡入；同為有行程的日期切換時，由 DateCard 自身的進出場處理 */}
            <FadeSwap swapKey={selectedDayEvents.length > 0 ? 'list' : 'empty'} className="relative h-full space-y-3">
            {selectedDayEvents.length > 0 ? (
              <AnimatePresence initial={false} mode="popLayout">
                {paginatedEvents.map(event => (
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
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex h-full max-h-32 items-center justify-center rounded-xl border-2 border-dashed border-[#dcd0c2]/50 py-6">
                <p className="text-[#3d3a36] text-sm">本日無行程，好好休息吧！😴</p>
              </div>
            )}
            </FadeSwap>
         </div>

         {/* Pagination Controls */}
         <Collapsible className="shrink-0">{totalPages > 1 && (
           <div className="mt-4 pt-3 border-t border-dashed border-[#dcd0c2]/50 flex items-center justify-between shrink-0">
             <Button size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} aria-label="上一頁">
               <ChevronLeft size={14} aria-hidden="true" />
               上一頁
             </Button>

             <span className="text-xs text-[#3d3a36]">
               第 <span className="text-[#5f7186] font-bold">{currentPage}</span> / {totalPages} 頁
             </span>

             <Button size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} aria-label="下一頁">
               下一頁
               <ChevronRight size={14} aria-hidden="true" />
             </Button>
           </div>
         )}</Collapsible>
      </div>
    </div>
  );
}
