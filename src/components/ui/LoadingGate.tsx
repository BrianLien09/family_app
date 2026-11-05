'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import CapybaraLoader from '@/components/CapybaraLoader';
import { DURATION, EASE_OUT } from '@/lib/motion';

interface LoadingGateProps {
  isLoaded: boolean;
  label: string;
  children: ReactNode;
}

/**
 * 載入畫面與內容的交叉淡入淡出。
 * 為什麼獨立成元件：四個頁面原本都是 `if (!isLoaded) return <CapybaraLoader/>`，
 * 載入結束時畫面是硬切；改成 mode="wait" 讓水豚先淡出、內容再淡入。
 * 兩個狀態的外層容器各自設定唯一 key，強制 React 重建 DOM，避免樣式殘留。
 */
export default function LoadingGate({ isLoaded, label, children }: LoadingGateProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoaded ? (
        <m.div
          key="content-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } }}
        >
          {children}
        </m.div>
      ) : (
        <m.div
          key="loading-view"
          exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
        >
          <CapybaraLoader label={label} />
        </m.div>
      )}
    </AnimatePresence>
  );
}
