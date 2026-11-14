'use client';

import { useEffect } from 'react';
import { animate, m, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/motion';

interface AnimatedNumberProps {
  value: number;
  /**
   * 數字轉字串。請傳入模組層級的穩定函式：
   * useTransform 只在建立時取用一次，每次渲染都換新函式也不會生效。
   */
  format: (value: number) => string;
  className?: string;
}

/**
 * 金額、計數、換算結果的平滑過渡。
 * 為什麼不直接換字：切月份或調份數時數字瞬間跳動，使用者看不出「變多還是變少」；
 * 以 motion value 補間，只更新文字節點、不觸發 React 重新渲染。
 * 系統開啟「減少動態效果」時直接顯示終值。
 */
export default function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, format);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: DURATION.slow, ease: EASE_OUT });
    return () => controls.stop();
  }, [motionValue, shouldReduceMotion, value]);

  return <m.span className={className}>{display}</m.span>;
}
