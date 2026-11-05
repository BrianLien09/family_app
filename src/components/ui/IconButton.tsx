'use client';

import clsx from 'clsx';
import { m, type HTMLMotionProps } from 'motion/react';
import { TAP_SCALE } from '@/lib/motion';

interface IconButtonProps extends HTMLMotionProps<'button'> {
  /** 純圖示按鈕必須有文字標籤，螢幕閱讀器才讀得出用途 */
  'aria-label': string;
  tone?: 'neutral' | 'danger' | 'accent';
}

const TONE_CLASS = {
  neutral: 'hover:bg-[#dcd0c2]/50 hover:text-[#b87e6b]',
  accent: 'hover:bg-[#5f7186]/10 hover:text-[#5f7186]',
  danger: 'hover:bg-[#9b4436]/10 hover:text-[#9b4436]',
} as const;

export default function IconButton({ tone = 'neutral', className, disabled, type = 'button', ...props }: IconButtonProps) {
  return (
    <m.button
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : TAP_SCALE}
      // h-11 w-11 達到 44px 觸控標準，手機上不會誤觸相鄰按鈕
      className={clsx(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#3d3a36] transition-colors duration-200 ease-out-expo',
        'disabled:cursor-not-allowed disabled:opacity-50',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  );
}
