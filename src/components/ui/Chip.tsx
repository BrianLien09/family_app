'use client';

import clsx from 'clsx';
import { m, type HTMLMotionProps } from 'motion/react';
import { TAP_SCALE } from '@/lib/motion';

interface ChipProps extends HTMLMotionProps<'button'> {
  selected: boolean;
}

/** 篩選膠囊：統一取代 MemberFilter、分類篩選、購買選項等各自手刻的版本 */
export default function Chip({ selected, className, type = 'button', ...props }: ChipProps) {
  return (
    <m.button
      type={type}
      aria-pressed={selected}
      whileTap={TAP_SCALE}
      className={clsx(
        'inline-flex min-h-10 max-w-full items-center gap-2 break-words rounded-xl border px-4 py-2 text-sm font-bold transition-colors duration-200 ease-out-expo',
        selected
          ? 'border-[#5f7186] bg-[#5f7186] text-[#f0ece1]'
          : 'border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50',
        className,
      )}
      {...props}
    />
  );
}
