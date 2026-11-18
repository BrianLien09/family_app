'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';
import {
  addDays, addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, isValid, parseISO, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { slideX } from '@/lib/motion';
import Collapsible from '@/components/ui/Collapsible';
import IconButton from '@/components/ui/IconButton';
import PickerTrigger from '@/components/ui/PickerTrigger';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];
// 面板內格子小，位移距離比首頁月曆（24px）短，避免看起來在晃動
const monthVariants = slideX(16);

interface DatePickerProps {
  label: string;
  /** yyyy-MM-dd */
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const toDateString = (date: Date) => format(date, 'yyyy-MM-dd');

function getRelativeLabel(date: Date): string | null {
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === 2) return '後天';
  if (diff === -1) return '昨天';
  return null;
}

/**
 * 行內展開的月曆日期選擇器。
 * 為什麼不做浮動 popover：彈窗本體會捲動且有 overflow 限制，浮層容易被裁切或在手機鍵盤彈出時錯位；
 * 行內展開會把下方欄位推開，在任何螢幕尺寸都可完整操作。
 */
export default function DatePicker({ label, value, onChange, isOpen, onOpenChange }: DatePickerProps) {
  const panelId = useId();
  const parsed = parseISO(value);
  const selected = isValid(parsed) ? parsed : null;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));
  const [direction, setDirection] = useState<1 | -1>(1);
  useRevealOnOpen(panelId, isOpen);

  const days = eachDayOfInterval({
    start: startOfWeek(viewMonth, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  });
  const relativeLabel = selected ? getRelativeLabel(selected) : null;
  const today = new Date();
  const quickOptions = [
    { label: '今天', date: today },
    { label: '明天', date: addDays(today, 1) },
    { label: '下週同天', date: addDays(today, 7) },
  ];

  const changeMonth = (next: Date) => {
    setDirection(next > viewMonth ? 1 : -1);
    setViewMonth(startOfMonth(next));
  };

  // 每次展開都回到已選日期所在月份，避免上次翻到別的月份後找不到目前的選擇
  const handleToggle = () => {
    if (!isOpen) setViewMonth(startOfMonth(selected ?? new Date()));
    onOpenChange(!isOpen);
  };

  // 選完即收合：日期是單一值，少按一次「完成」在手機上更順手
  const handleSelect = (date: Date) => {
    onChange(toDateString(date));
    onOpenChange(false);
  };

  return (
    <div className="min-w-0">
      <PickerTrigger
        label={label}
        icon={<CalendarDays size={18} />}
        value={selected ? format(selected, 'yyyy年M月d日 EEEE', { locale: zhTW }) : ''}
        placeholder="選擇日期"
        hint={relativeLabel && (
          <span className="shrink-0 rounded-full bg-[#5f7186] px-2.5 py-1 text-xs font-bold text-[#f0ece1]">{relativeLabel}</span>
        )}
        isOpen={isOpen}
        panelId={panelId}
        onClick={handleToggle}
      />

      <Collapsible className="pt-2">{isOpen && (
        <div id={panelId} className="rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] p-3 shadow-[0_8px_20px_rgba(139,121,101,0.08)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <IconButton aria-label="上個月" onClick={() => changeMonth(subMonths(viewMonth, 1))}><ChevronLeft size={20} /></IconButton>
            <span className="text-base font-bold text-[#3d3a36]" aria-live="polite">{format(viewMonth, 'yyyy年 M月')}</span>
            <IconButton aria-label="下個月" onClick={() => changeMonth(addMonths(viewMonth, 1))}><ChevronRight size={20} /></IconButton>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {quickOptions.map(option => {
              const isActive = selected !== null && isSameDay(option.date, selected);
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelect(option.date)}
                  className={clsx(
                    'min-h-9 rounded-full border px-3 py-1 text-xs font-bold transition-colors duration-fast ease-out-expo',
                    isActive
                      ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]'
                      : 'border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-7 pb-1 text-center text-xs font-bold text-[#5f6368]">
            {WEEK_DAYS.map(day => <span key={day}>{day}</span>)}
          </div>

          {/* 新舊月份以 grid 疊放交錯滑動，高度不會在切換瞬間跳動 */}
          <div className="grid overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <m.div
                key={format(viewMonth, 'yyyy-MM')}
                custom={direction}
                variants={monthVariants}
                initial="enter"
                animate="center"
                exit="leave"
                className="col-start-1 row-start-1 grid grid-cols-7 gap-1"
              >
                {days.map(day => {
                  const isSelected = selected !== null && isSameDay(day, selected);
                  const isTodayDate = isToday(day);
                  const isOutside = !isSameMonth(day, viewMonth);
                  return (
                    <button
                      key={toDateString(day)}
                      type="button"
                      onClick={() => handleSelect(day)}
                      aria-pressed={isSelected}
                      aria-current={isTodayDate ? 'date' : undefined}
                      aria-label={`${isTodayDate ? '今天，' : ''}${format(day, 'M月d日 EEEE', { locale: zhTW })}`}
                      className={clsx(
                        'relative flex h-11 items-center justify-center rounded-xl text-sm tabular-nums transition-colors duration-fast ease-out-expo',
                        isSelected
                          ? 'bg-[#b87e6b] font-bold text-[#f0ece1] shadow-[0_4px_12px_rgba(184,126,107,0.25)]'
                          : isTodayDate
                            ? 'font-bold text-[#5f7186] ring-2 ring-inset ring-[#5f7186]/50 hover:bg-[#5f7186]/10'
                            : 'text-[#3d3a36] hover:bg-[#dcd0c2]/40',
                        isOutside && !isSelected && 'opacity-40',
                      )}
                    >
                      {format(day, 'd')}
                      {/* 今天的小圓點與首頁月曆的石板藍呼應，被選取時改用淺色維持辨識 */}
                      {isTodayDate && (
                        <span aria-hidden="true" className={clsx('absolute bottom-1.5 h-1 w-1 rounded-full', isSelected ? 'bg-[#f0ece1]' : 'bg-[#5f7186]')} />
                      )}
                    </button>
                  );
                })}
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      )}</Collapsible>
    </div>
  );
}
