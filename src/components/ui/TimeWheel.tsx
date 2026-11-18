'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import clsx from 'clsx';

const ITEM_HEIGHT = 44;
// 上下各露出兩格，使用者看得到前後的值，知道還可以繼續滾
const VISIBLE_PADDING = 2;
// 停止滾動後才提交：避免滑動途中每經過一格就觸發一次更新，造成父層連續重繪
const SETTLE_DELAY_MS = 120;

interface WheelColumnProps {
  ariaLabel: string;
  /** 例如 24（時）或 60（分）：數值為 0 ~ count-1 */
  count: number;
  value: number;
  onChange: (value: number) => void;
  unit: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * 單一滾輪欄位（時或分）。
 * 為什麼用原生捲動＋scroll-snap 而不是自己算拖曳：手機慣性滑動、桌面滑鼠滾輪、觸控板都由瀏覽器處理，
 * 手感與系統一致；我們只在捲動停下後讀取對齊的格子，0～59 任何分鐘都能直接選到。
 */
function WheelColumn({ ariaLabel, count, value, onChange, unit }: WheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const hasMounted = useRef(false);
  const [centerIndex, setCenterIndex] = useState(value);

  // 外部改值（快速時長、切換開始／結束）時把滾輪轉到對應位置；首次掛載直接定位，不播放捲動動畫
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const target = value * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - target) < 1) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ top: target, behavior: hasMounted.current && !reduceMotion ? 'smooth' : 'auto' });
    hasMounted.current = true;
  }, [value]);

  useEffect(() => () => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
  }, []);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const index = Math.min(count - 1, Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)));
    setCenterIndex(index);
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (index !== value) onChange(index);
    }, SETTLE_DELAY_MS);
  };

  // 鍵盤上下鍵逐格調整並循環，桌面不用滑鼠也能精準選到任何一分鐘
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onChange((value + step + count) % count);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={listRef}
        role="spinbutton"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="no-scrollbar relative z-10 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#b87e6b]/40"
        style={{ height: ITEM_HEIGHT * (VISIBLE_PADDING * 2 + 1), paddingTop: ITEM_HEIGHT * VISIBLE_PADDING, paddingBottom: ITEM_HEIGHT * VISIBLE_PADDING }}
      >
        {Array.from({ length: count }, (_, index) => {
          const distance = Math.abs(index - centerIndex);
          return (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => onChange(index)}
              className={clsx(
                'flex w-full snap-center items-center justify-center tabular-nums transition-[color,opacity] duration-fast ease-out-expo',
                distance === 0 ? 'text-2xl font-bold text-[#3d3a36]' : 'text-lg font-medium text-[#5f6368]',
                distance === 1 && 'opacity-70',
                distance >= 2 && 'opacity-35',
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {pad(index)}
            </button>
          );
        })}
      </div>
      {/* 中央選取帶：放在滾輪下層，數字捲過時像被框住，一眼知道目前選的是哪一格 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 rounded-xl border-2 border-[#b87e6b]/40 bg-[#b87e6b]/10"
        style={{ top: ITEM_HEIGHT * VISIBLE_PADDING, height: ITEM_HEIGHT }}
      />
    </div>
  );
}

interface TimeWheelProps {
  /** HH:mm */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** 時、分兩欄滾輪；value 必須是有效的 HH:mm，空值的處理交給呼叫端決定 */
export default function TimeWheel({ value, onChange, ariaLabel }: TimeWheelProps) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText) || 0;
  const minute = Number(minuteText) || 0;

  return (
    <div role="group" aria-label={ariaLabel} className="mx-auto flex w-full max-w-[16rem] items-center gap-2">
      <WheelColumn ariaLabel="時" unit="點" count={24} value={hour} onChange={next => onChange(`${pad(next)}:${pad(minute)}`)} />
      <span aria-hidden="true" className="text-2xl font-bold text-[#5f6368]">:</span>
      <WheelColumn ariaLabel="分" unit="分" count={60} value={minute} onChange={next => onChange(`${pad(hour)}:${pad(next)}`)} />
    </div>
  );
}
