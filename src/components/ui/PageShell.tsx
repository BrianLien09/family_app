import clsx from 'clsx';
import type { ReactNode } from 'react';

interface PageShellProps {
  /** wide 用於總覽與月曆（需要橫向空間）；narrow 用於清單型頁面 */
  width?: 'wide' | 'narrow' | 'medium';
  children: ReactNode;
}

const WIDTH_CLASS = {
  wide: 'max-w-[80rem] sm:px-8 lg:px-12',
  medium: 'max-w-5xl sm:px-8',
  narrow: 'max-w-3xl',
} as const;

/**
 * 頁面外框：統一最大寬度與頂部間距。
 * pt-24 = 70px 導覽列 + 約 26px 呼吸空間，取代過去各頁不一的 pt-20／24／28。
 */
export default function PageShell({ width = 'narrow', children }: PageShellProps) {
  return <div className={clsx('mx-auto w-full px-4 pb-10 pt-24', WIDTH_CLASS[width])}>{children}</div>;
}
