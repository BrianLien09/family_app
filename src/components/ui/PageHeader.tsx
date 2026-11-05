import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** 視覺上隱藏標題，但保留給螢幕閱讀器作為頁面 h1 */
  visuallyHidden?: boolean;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, visuallyHidden = false, actions }: PageHeaderProps) {
  if (visuallyHidden) return <h1 className="sr-only">{title}</h1>;
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[#3d3a36]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#5f6368]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
