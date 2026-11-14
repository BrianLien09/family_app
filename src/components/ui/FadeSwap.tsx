'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { crossFade } from '@/lib/motion';

interface FadeSwapProps {
  /** 內容身分；改變時舊內容先淡出、新內容再淡入 */
  swapKey: string | number;
  children: ReactNode;
  className?: string;
  /** 行內文字（標題、按鈕文字）用 span，避免在 p／button 內放 div 造成無效 HTML */
  as?: 'div' | 'span';
}

/**
 * 同一位置的內容替換：空狀態↔清單、換算方式、預覽卡、按鈕文字。
 * 為什麼用 mode="wait"：新舊內容不重疊，避免兩份內容同時佔位造成高度跳動；
 * swapKey 同時作為外層容器的唯一 key，符合「狀態切換加 key」的排版守則。
 * 數字連續變化（金額、份數）請改用 AnimatedNumber，否則每次輸入都會等待一輪淡出淡入。
 */
export default function FadeSwap({ swapKey, children, className, as = 'div' }: FadeSwapProps) {
  const Component = as === 'span' ? m.span : m.div;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Component
        key={swapKey}
        variants={crossFade}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </Component>
    </AnimatePresence>
  );
}
