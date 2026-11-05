'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';

/**
 * 全站動畫設定。
 * - 使用 domMax：Navbar 滑動底板與清單重排需要 layout／layoutId 功能，domAnimation 不包含。
 * - reducedMotion="user"：系統開啟「減少動態效果」時，位移與縮放自動停用，僅保留透明度變化。
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
