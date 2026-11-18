'use client';

import { useEffect } from 'react';
import { DURATION } from '@/lib/motion';

/**
 * 展開面板後把它捲進彈窗可視範圍。
 * 為什麼要等展開動畫結束：Collapsible 由高度 0 長到 auto，動畫期間量到的高度不準，
 * 太早捲動只會捲到一半；桌面彈窗高度有限，日期或時間面板常常整個落在操作列下方看不到。
 */
export function useRevealOnOpen(elementId: string, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(elementId)?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }, DURATION.slow * 1000);
    return () => window.clearTimeout(timer);
  }, [elementId, isOpen]);
}
