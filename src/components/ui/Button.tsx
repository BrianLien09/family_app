'use client';

import clsx from 'clsx';
import { m, type HTMLMotionProps } from 'motion/react';
import { TAP_SCALE } from '@/lib/motion';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// 只過渡顏色相關屬性，取代過去散落各處的 transition-all，避免陰影與邊框一起重繪
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[#b87e6b] text-[#f0ece1] hover:bg-[#a66a58] shadow-[0_4px_12px_rgba(184,126,107,0.2)]',
  secondary: 'bg-[#5f7186] text-[#f0ece1] hover:bg-[#47576b] shadow-[0_4px_12px_rgba(95,113,134,0.2)]',
  soft: 'bg-[#dcd0c2]/30 text-[#3d3a36] hover:bg-[#dcd0c2]/50',
  danger: 'bg-[#9b4436]/10 text-[#9b4436] hover:bg-[#9b4436]/20',
  ghost: 'text-[#3d3a36] hover:bg-[#dcd0c2]/40 hover:text-[#b87e6b]',
};

// md 維持 44px 的觸控高度；sm 用於工具列等密集區域，仍保有 36px
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-1.5 rounded-lg px-3 py-1.5 text-xs',
  md: 'min-h-11 gap-2 rounded-xl px-4 py-2.5 text-sm',
};

export default function Button({ variant = 'soft', size = 'md', className, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <m.button
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : TAP_SCALE}
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap font-bold transition-colors duration-200 ease-out-expo',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  );
}
