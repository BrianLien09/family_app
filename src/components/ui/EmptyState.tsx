import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** 空狀態：統一圖示、標題、說明與行動按鈕，取代各頁不同版型 */
export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#dcd0c2]/70 bg-[#dcd0c2]/30 px-6 py-12 text-center text-[#3d3a36]">
      <Icon className="text-[#5f7186]" size={32} aria-hidden="true" />
      <h3 className="font-bold">{title}</h3>
      {description && <p className="text-sm text-[#5f6368]">{description}</p>}
      {action}
    </div>
  );
}
