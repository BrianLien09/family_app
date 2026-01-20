// src/components/UpdatePrompt.tsx
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdatePromptProps {
  /** 點擊更新按鈕的回調 */
  onUpdate: () => void;
  /** 點擊關閉按鈕的回調 */
  onDismiss: () => void;
  /** 是否正在更新中 */
  isUpdating?: boolean;
}

/**
 * PWA 更新提示元件
 * 
 * 當有新版本可用時，會在螢幕底部顯示提示橫幅
 * 採用 glassmorphism 設計風格，符合整體 UI
 */
export default function UpdatePrompt({ 
  onUpdate, 
  onDismiss, 
  isUpdating = false 
}: UpdatePromptProps) {
  const [isVisible, setIsVisible] = useState(false);

  // 淡入動畫
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    setIsVisible(false);
    setTimeout(onUpdate, 300); // 等待淡出動畫
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // 等待淡出動畫
  };

  return (
    <div
      className={`
        fixed bottom-20 left-4 right-4 z-50
        md:left-auto md:right-6 md:max-w-md
        transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="glass-card p-4 border border-purple-500/30 shadow-xl">
        <div className="flex items-start gap-3">
          {/* 圖示區 */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <RefreshCw 
                size={20} 
                className={`text-white ${isUpdating ? 'animate-spin' : ''}`}
              />
            </div>
          </div>

          {/* 內容區 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              {isUpdating ? '更新中...' : '有新版本可用'}
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              {isUpdating 
                ? '正在套用最新版本，請稍候...' 
                : '發現新功能和改進，建議立即更新以獲得最佳體驗'}
            </p>

            {/* 按鈕群 */}
            {!isUpdating && (
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="
                    px-4 py-2 rounded-lg text-xs font-medium
                    bg-gradient-to-r from-purple-500 to-pink-500
                    hover:from-purple-600 hover:to-pink-600
                    text-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0f111a]
                  "
                  aria-label="更新應用程式"
                >
                  立即更新
                </button>
                <button
                  onClick={handleDismiss}
                  className="
                    px-4 py-2 rounded-lg text-xs font-medium
                    bg-white/5 hover:bg-white/10
                    text-slate-300 transition-all
                    focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0f111a]
                  "
                  aria-label="稍後再說"
                >
                  稍後再說
                </button>
              </div>
            )}

            {/* 更新中的載入動畫 */}
            {isUpdating && (
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                  style={{ width: '70%' }}
                />
              </div>
            )}
          </div>

          {/* 關閉按鈕 */}
          {!isUpdating && (
            <button
              onClick={handleDismiss}
              className="
                flex-shrink-0 w-8 h-8 rounded-full
                flex items-center justify-center
                text-slate-400 hover:text-white hover:bg-white/10
                transition-all
                focus:outline-none focus:ring-2 focus:ring-white/20
              "
              aria-label="關閉提示"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
