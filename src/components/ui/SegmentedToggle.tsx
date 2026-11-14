'use client';

import clsx from 'clsx';
import { m } from 'motion/react';
import { SPRING_SOFT } from '@/lib/motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** 選中時底板顏色；需為大地色系色票（例如支出鐵鏽、收入石板藍） */
  color: string;
}

interface SegmentedToggleProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * 等寬的分段切換（支出／收入等）。
 * 為什麼用單一底板做 x 位移，而不是 layoutId：底板需要同時滑動與換色，
 * 單一元素可以讓位置與顏色用同一組彈簧一起過渡，不會先跳色再滑動。
 */
export default function SegmentedToggle<T extends string>({ options, value, onChange, ariaLabel }: SegmentedToggleProps<T>) {
  const activeIndex = Math.max(0, options.findIndex(option => option.value === value));
  const activeColor = options[activeIndex]?.color;

  return (
    <div className="relative flex rounded-xl bg-[#dcd0c2]/30 p-1" role="group" aria-label={ariaLabel}>
      <m.span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded-lg shadow-[0_4px_12px_rgba(139,121,101,0.06)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})` }}
        initial={false}
        animate={{ x: `${activeIndex * 100}%`, backgroundColor: activeColor }}
        transition={SPRING_SOFT}
      />
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) onChange(option.value);
            }}
            className={clsx(
              'relative z-10 min-h-11 flex-1 rounded-lg py-2 text-sm font-bold transition-colors duration-fast ease-out-expo',
              isActive ? 'text-[#f0ece1]' : 'text-[#3d3a36] hover:text-[#b87e6b]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
