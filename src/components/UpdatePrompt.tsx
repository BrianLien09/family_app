// src/components/UpdatePrompt.tsx
'use client';

import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { m } from 'motion/react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { fadeUp } from '@/lib/motion';

interface UpdatePromptProps {
  /** 點擊更新按鈕的回調 */
  onUpdate: () => void;
  /** 點擊關閉按鈕的回調 */
  onDismiss: () => void;
  /** 是否正在更新中 */
  isUpdating?: boolean;
}

type LeaveAction = 'update' | 'dismiss';

/**
 * PWA 更新提示元件
 *
 * 當有新版本可用時，會在螢幕底部顯示提示橫幅。
 * 離場改由動畫完成事件觸發回調，不再用 setTimeout 猜動畫時間，
 * 這樣在「減少動態效果」模式下也不會多等 300ms。
 */
export default function UpdatePrompt({
  onUpdate,
  onDismiss,
  isUpdating = false,
}: UpdatePromptProps) {
  const [leaving, setLeaving] = useState<LeaveAction | null>(null);

  return (
    <m.div
      variants={fadeUp}
      initial="hidden"
      animate={leaving ? 'exit' : 'visible'}
      onAnimationComplete={() => {
        if (leaving === 'update') onUpdate();
        if (leaving === 'dismiss') onDismiss();
      }}
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md"
      role="status"
      aria-live="polite"
    >
      <div className="glass-card p-4 border-2 border-dashed border-[#5f7186]/50 shadow-[0_12px_24px_rgba(139,121,101,0.1)]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5f7186] to-[#b87e6b] flex items-center justify-center">
              <RefreshCw
                size={20}
                className={`text-[#f0ece1] ${isUpdating ? 'motion-safe:animate-spin' : ''}`}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[#3d3a36] font-semibold text-sm mb-1">
              {isUpdating ? '更新中...' : '有新版本可用'}
            </h3>
            <p className="text-[#5f6368] text-xs mb-3">
              {isUpdating
                ? '正在套用最新版本，請稍候...'
                : '發現新功能和改進，建議立即更新以獲得最佳體驗'}
            </p>

            {!isUpdating && (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={() => setLeaving('update')} aria-label="更新應用程式">
                  立即更新
                </Button>
                <Button size="sm" onClick={() => setLeaving('dismiss')} aria-label="稍後再說">
                  稍後再說
                </Button>
              </div>
            )}

            {isUpdating && (
              <div className="h-1 bg-[#dcd0c2]/30 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#5f7186] to-[#b87e6b] motion-safe:animate-pulse"
                  style={{ width: '70%' }}
                />
              </div>
            )}
          </div>

          {!isUpdating && (
            <IconButton aria-label="關閉提示" onClick={() => setLeaving('dismiss')} className="h-9 w-9">
              <X size={16} />
            </IconButton>
          )}
        </div>
      </div>
    </m.div>
  );
}
