'use client';

import { useState, useMemo } from 'react'; // 1. 引入 useMemo
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { DateItem } from '@/types';
import DateCard from '@/components/DateManager/DateCard';

interface CalendarWidgetProps {
  events: DateItem[];
  onSelectDate?: (date: Date) => void;
  onDelete: (id: string) => void;
  onEdit: (item: DateItem) => void;
}

export default function CalendarWidget({ events, onSelectDate, onDelete, onEdit }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 設定週一為一週的開始
  const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (onSelectDate) onSelectDate(day);
  };

  // ✨✨✨ 優化重點 1: 使用 useMemo 預先分組資料 ✨✨✨
  // 將陣列轉為物件索引: { "2024-01-01": [EventA, EventB], ... }
  // 這樣渲染時就不用每一格都跑 filter 迴圈了
  const eventsByDate = useMemo(() => {
    const groups: Record<string, DateItem[]> = {};
    
    events.forEach(event => {
      // 統一轉成 yyyy-MM-dd 字串當作 key
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return groups;
  }, [events]); // 只有當 events 變動時，才重新計算

  // ✨✨✨ 優化重點 2: 選中日期的行程也改用查表法 ✨✨✨
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  // 輔助函式：取得顏色樣式
  const getEventColor = (category: string) => {
    if (category === '洗牙') return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    if (category === '剪頭髮') return 'bg-orange-500/20 text-orange-200 border-orange-500/30';
    if (category === '阿弟排班') return 'bg-green-500/20 text-green-200 border-green-500/30';
    return 'bg-pink-500/20 text-pink-200 border-pink-500/30';
  };
  
  const getDotColor = (category: string) => {
    if (category === '洗牙') return 'bg-blue-400';
    if (category === '剪頭髮') return 'bg-orange-400';
    if (category === '阿弟排班') return 'bg-green-400';
    return 'bg-pink-500';
  };

  return (
    <div className="glass-card p-4 md:p-6 select-none h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
        <h2 className="text-lg md:text-2xl font-bold text-white tracking-wide">
          {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
        </h2>
        <div className="flex gap-2">
           <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
             <ChevronLeft size={20} />
           </button>
           <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2 text-center shrink-0 border-b border-white/5 pb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs md:text-sm font-bold text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px md:gap-1 bg-white/5 rounded-lg overflow-hidden border border-white/5 shrink-0">
        {days.map((day) => {
          // ✨✨✨ 優化重點 3: 直接用 Key 取值 (O(1) 複雜度) ✨✨✨
          // 取代原本的 events.filter (O(N) 複雜度)
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];

          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDayClick(day)}
              className={clsx(
                "relative flex flex-col cursor-pointer transition-all duration-200 p-1 md:p-2 group",
                "aspect-square md:aspect-auto md:min-h-[110px]", 
                
                !isCurrentMonth ? "bg-black/20 text-slate-600" : "bg-white/[0.02] hover:bg-white/[0.05]",
                isSelected && "bg-white/[0.08] ring-1 ring-inset ring-purple-500",
                isTodayDate && !isSelected && "bg-blue-500/5"
              )}
            >
              <span className={clsx(
                "text-xs font-medium mb-1 block text-center md:text-left",
                isTodayDate ? "text-blue-400 font-bold" : "text-slate-400",
                isSelected && "text-white",
                !isCurrentMonth && "opacity-50"
              )}>
                {format(day, 'd')}
              </span>

              {/* 手機版顯示 (圓點) */}
              <div className="flex gap-0.5 justify-center flex-wrap content-start md:hidden">
                {dayEvents.slice(0, 4).map((event, idx) => (
                  <div 
                    key={idx}
                    className={clsx("rounded-full w-1.5 h-1.5", getDotColor(event.category))}
                  />
                ))}
              </div>

              {/* 電腦版顯示 (文字條) */}
              <div className="hidden md:flex flex-col gap-1.5 w-full overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                   <div 
                     key={event.id}
                     className={clsx(
                       "text-xs font-bold px-2 py-1 rounded border truncate shadow-sm",
                       getEventColor(event.category)
                     )}
                     title={event.title} 
                   >
                     {event.title}
                   </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <span className="text-[11px] font-medium text-slate-400 pl-1">
                    還有 {dayEvents.length - 3} 個...
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      <div className="mt-4 pt-4 border-t border-white/10 flex-1 flex flex-col min-h-0">
         <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2 shrink-0">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            {format(selectedDate, 'M月d日')} 的行程 ({selectedDayEvents.length})
         </h3>
         
         <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map(event => (
                <DateCard 
                  key={event.id}
                  item={event}
                  onDelete={onDelete}
                  onEdit={() => onEdit(event)} 
                />
              ))
            ) : (
              <div className="h-full max-h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                <p className="text-slate-500 text-sm">本日無行程，好好休息吧！😴</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}