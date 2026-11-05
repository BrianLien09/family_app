'use client';

import type { ReactNode } from 'react';
import { m } from 'motion/react';
import { fadeUp } from '@/lib/motion';

/**
 * 路由切換進場動畫。
 * 為什麼只做進場：App Router 的 template 在切換時會直接重建，無法穩定地等待離場動畫，
 * 硬做離場會造成舊頁面閃現或延遲導覽，因此只提示「內容已切換」。
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <m.div variants={fadeUp} initial="hidden" animate="visible">
      {children}
    </m.div>
  );
}
