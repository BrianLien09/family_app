'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { collapse } from '@/lib/motion';

interface CollapsibleProps {
  /** children 為 false／null／undefined 時收合，寫法與原本的 `{cond && <... />}` 相同 */
  children?: ReactNode;
  className?: string;
}

/**
 * 條件區塊的展開收合。
 * 為什麼用「children 是否為空」決定開合，而不是另給 isOpen：
 * 呼叫端只要把原本的條件渲染包起來即可，收合時子樹真的不存在，
 * 原生必填驗證與表單測試（以樹狀遍歷尋找欄位）的行為都和改動前一致。
 * 間距請放在 className（內邊距）而非外層 gap，否則收合瞬間間距會跳動。
 */
export default function Collapsible({ children, className }: CollapsibleProps) {
  const isOpen = children !== null && children !== undefined && children !== false;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <m.div
          key="collapsible-content"
          variants={collapse}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
