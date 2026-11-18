'use client';

import { useId } from 'react';
import clsx from 'clsx';
import { ArrowRight, Clock, X } from 'lucide-react';
import Collapsible from '@/components/ui/Collapsible';
import FadeSwap from '@/components/ui/FadeSwap';
import TimeWheel from '@/components/ui/TimeWheel';
import PickerTrigger from '@/components/ui/PickerTrigger';
import { useRevealOnOpen } from '@/hooks/useRevealOnOpen';

export type TimeField = 'start' | 'end';

interface TimeRangePickerProps {
  /** 群組名稱，供螢幕閱讀器辨識是哪一組時間 */
  ariaLabel: string;
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  activeField: TimeField | null;
  onActiveFieldChange: (field: TimeField | null) => void;
  startLabel?: string;
  endLabel?: string;
}

const PERIODS = [
  { label: '凌晨', until: 6 },
  { label: '上午', until: 12 },
  { label: '下午', until: 18 },
  { label: '晚上', until: 24 },
];
// 開始時間尚未設定時的起點：家庭行程多在白天，從 9 點開始比從 0 點少滾很多格
const DEFAULT_START = '09:00';
// 結束時間＝開始時間＋時長：常駐在時間欄位下方，不必打開面板就能一鍵設定
const DURATION_PRESETS = [
  { label: '30 分', minutes: 30 },
  { label: '1 小時', minutes: 60 },
  { label: '1.5 小時', minutes: 90 },
  { label: '2 小時', minutes: 120 },
];
// 面板內微調目前編輯中的時間：滾輪適合大範圍移動，小幅前後挪用按鈕更快
const NUDGES = [
  { label: '-30 分', minutes: -30 },
  { label: '+30 分', minutes: 30 },
  { label: '+1 小時', minutes: 60 },
];

const pad = (value: number) => String(value).padStart(2, '0');

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

const toMinutes = (value: string) => {
  const parsed = parseTime(value);
  return parsed ? parsed.hour * 60 + parsed.minute : null;
};

const fromMinutes = (total: number) => {
  // 跨過午夜時回到 0 點起算，與「跨夜行程」的顯示方式一致
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

function getPeriod(value: string): string | null {
  const parsed = parseTime(value);
  if (!parsed) return null;
  return PERIODS.find(period => parsed.hour < period.until)?.label ?? null;
}

function getDurationLabel(start: string, end: string): string | null {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return null;
  // 結束早於開始視為跨夜（例如值班 22:00～06:00），不當成錯誤擋下，避免限制既有使用情境
  const isOvernight = endMinutes < startMinutes;
  const total = isOvernight ? endMinutes + 1440 - startMinutes : endMinutes - startMinutes;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const text = [hours > 0 && `${hours} 小時`, minutes > 0 && `${minutes} 分`].filter(Boolean).join(' ');
  return `${isOvernight ? '跨夜，' : ''}共 ${text}`;
}

function getNowString(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const QUICK_CHIP_CLASS = 'min-h-9 rounded-full border px-3 py-1 text-xs font-bold transition-colors duration-fast ease-out-expo';
const quickChipState = (isActive: boolean) => isActive
  ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]'
  : 'border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50';

/**
 * 開始／結束時間選擇器：兩個觸發按鈕並排，點哪個就在下方全寬面板編輯哪個。
 * 為什麼改成滾輪：時、分各自一欄、滑到即選定，0～59 任何分鐘都能選，
 * 不必像按鈕格那樣先點時、再點分、再按完成；面板上方的觸發按鈕同時就是「開始／結束」分頁，
 * 隨時能看到兩個值並切換。
 */
export default function TimeRangePicker({
  ariaLabel, startTime, endTime, onStartChange, onEndChange, activeField, onActiveFieldChange,
  startLabel = '開始時間', endLabel = '結束（選填）',
}: TimeRangePickerProps) {
  const panelId = useId();
  useRevealOnOpen(panelId, activeField !== null);
  const durationLabel = getDurationLabel(startTime, endTime);
  const startMinutes = toMinutes(startTime);
  const isEditingEnd = activeField === 'end';
  const activeValue = isEditingEnd ? endTime : startTime;
  const setActiveValue = isEditingEnd ? onEndChange : onStartChange;
  const activeMinutes = toMinutes(activeValue);

  const toggleField = (field: TimeField) => onActiveFieldChange(activeField === field ? null : field);

  // 結束時間預設接在開始後一小時：多數行程長度接近一小時，滾輪從這裡微調最省力
  const getEndDefault = () => (startMinutes !== null ? fromMinutes(startMinutes + 60) : '10:00');

  // 時段文字跟在數字後面而不是另佔一欄，手機並排兩個觸發按鈕時才放得下
  const renderValue = (value: string) => {
    if (!value) return '';
    const period = getPeriod(value);
    return <>{value}{period && <span className="ml-1.5 text-xs font-bold text-[#5f6368]">{period}</span>}</>;
  };

  return (
    <div role="group" aria-label={ariaLabel} className="min-w-0">
      <div className="grid grid-cols-2 gap-3">
        <PickerTrigger
          label={startLabel}
          icon={<Clock size={18} />}
          value={renderValue(startTime)}
          isOpen={activeField === 'start'}
          panelId={panelId}
          onClick={() => toggleField('start')}
        />
        <PickerTrigger
          label={endLabel}
          icon={<Clock size={18} />}
          value={renderValue(endTime)}
          isOpen={isEditingEnd}
          panelId={panelId}
          onClick={() => toggleField('end')}
        />
      </div>

      <Collapsible>{startMinutes !== null && (
        <div className="flex flex-wrap items-center gap-2 pt-2.5" role="group" aria-label="快速設定時長">
          <span className="text-xs font-bold text-[#5f6368]">時長</span>
          {DURATION_PRESETS.map(preset => {
            const value = fromMinutes(startMinutes + preset.minutes);
            const isActive = endTime === value;
            return (
              <button key={preset.label} type="button" aria-pressed={isActive}
                aria-label={`結束時間設為開始後 ${preset.label}`}
                onClick={() => onEndChange(value)} className={clsx(QUICK_CHIP_CLASS, quickChipState(isActive))}>
                {preset.label}
              </button>
            );
          })}
          {durationLabel && <span className="ml-auto text-xs font-bold text-[#5f7186]">{durationLabel}</span>}
        </div>
      )}</Collapsible>

      <Collapsible className="pt-2">{activeField && (
        <div id={panelId} className="space-y-4 rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] p-4 shadow-[0_8px_20px_rgba(139,121,101,0.08)]">
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            {!isEditingEnd && (
              <button type="button" onClick={() => onStartChange(getNowString())} className={clsx(QUICK_CHIP_CLASS, quickChipState(false))}>
                現在
              </button>
            )}
            {activeMinutes !== null && NUDGES.map(nudge => (
              <button key={nudge.label} type="button"
                aria-label={`${isEditingEnd ? '結束' : '開始'}時間${nudge.label}`}
                onClick={() => setActiveValue(fromMinutes(activeMinutes + nudge.minutes))}
                className={clsx(QUICK_CHIP_CLASS, quickChipState(false))}>
                {nudge.label}
              </button>
            ))}
          </div>

          {/* 切換開始／結束時重建滾輪，讓它直接定位到新欄位的值，而不是從上一個值捲過去 */}
          <FadeSwap swapKey={`${activeField}-${activeValue ? 'set' : 'empty'}`}>
            {activeValue ? (
              <TimeWheel
                ariaLabel={isEditingEnd ? '結束時間' : '開始時間'}
                value={activeValue}
                onChange={setActiveValue}
              />
            ) : (
              // 選填的結束時間不能因為打開面板就被自動填入，所以空值時先讓使用者明確選擇要不要設定
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-[#5f6368]">{isEditingEnd ? '尚未設定結束時間' : '尚未設定開始時間'}</p>
                <button
                  type="button"
                  onClick={() => setActiveValue(isEditingEnd ? getEndDefault() : DEFAULT_START)}
                  className="min-h-11 rounded-xl bg-[#5f7186] px-5 text-sm font-bold text-[#f0ece1] transition-colors duration-fast ease-out-expo hover:bg-[#47576b]"
                >
                  {isEditingEnd ? '設定結束時間' : '設定開始時間'}
                </button>
              </div>
            )}
          </FadeSwap>

          <div className="flex items-center justify-between gap-2 border-t border-dashed border-[#dcd0c2] pt-3">
            {isEditingEnd && endTime ? (
              <button
                type="button"
                onClick={() => onEndChange('')}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-[#9b4436] transition-colors duration-fast ease-out-expo hover:bg-[#9b4436]/10"
              >
                <X size={16} aria-hidden="true" />清除
              </button>
            ) : !isEditingEnd && startTime ? (
              // 設好開始後最常接著設結束，直接提供下一步，不必先收合再點另一個欄位
              <button
                type="button"
                onClick={() => onActiveFieldChange('end')}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-[#5f7186] transition-colors duration-fast ease-out-expo hover:bg-[#5f7186]/10"
              >
                設定結束<ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={() => onActiveFieldChange(null)}
              className="min-h-11 rounded-xl bg-[#b87e6b] px-6 text-sm font-bold text-[#f0ece1] transition-colors duration-fast ease-out-expo hover:bg-[#a66a58]"
            >
              完成
            </button>
          </div>
        </div>
      )}</Collapsible>
    </div>
  );
}
