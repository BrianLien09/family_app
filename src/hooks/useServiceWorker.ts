// src/hooks/useServiceWorker.ts
'use client';

import { useState, useEffect } from 'react';

interface ServiceWorkerHook {
  /** 是否有新版本可用 */
  updateAvailable: boolean;
  /** 是否正在更新中 */
  isUpdating: boolean;
  /** 執行更新（重新載入頁面） */
  updateApp: () => void;
  /** 忽略此次更新 */
  dismissUpdate: () => void;
}

/**
 * PWA Service Worker 更新檢測 Hook
 * 
 * 功能：
 * - 自動檢測 Service Worker 更新
 * - 提供更新控制方法
 * - 處理更新流程
 * 
 * 使用範例：
 * ```tsx
 * const { updateAvailable, updateApp, dismissUpdate } = useServiceWorker();
 * 
 * {updateAvailable && (
 *   <UpdatePrompt onUpdate={updateApp} onDismiss={dismissUpdate} />
 * )}
 * ```
 */
export function useServiceWorker(): ServiceWorkerHook {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // 只在支援 Service Worker 的環境執行
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 檢查是否已有註冊的 Service Worker
    navigator.serviceWorker.ready.then((registration) => {
      // 監聽 Service Worker 狀態變化
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // 當新的 SW 進入 waiting 狀態，表示有更新可用
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });

      // 立即檢查是否已經有 waiting 的 Service Worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // 手動觸發更新檢查（每次載入時）
      registration.update().catch((error) => {
        console.log('SW 更新檢查失敗:', error);
      });
    });

    // 監聽來自 Service Worker 的訊息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        setUpdateAvailable(true);
      }
    });

    // 每 60 秒檢查一次更新（背景檢查）
    const intervalId = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().catch(() => {
          // 靜默失敗，不影響使用者體驗
        });
      });
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /**
   * 執行更新：通知 waiting 的 Service Worker 接管並重新載入頁面
   */
  const updateApp = () => {
    if (!waitingWorker) return;

    setIsUpdating(true);

    // 發送 SKIP_WAITING 訊息給等待中的 Service Worker
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // 監聽 Service Worker 狀態變化
    waitingWorker.addEventListener('statechange', (event) => {
      const target = event.target as ServiceWorker;
      if (target.state === 'activated') {
        // 新的 SW 已接管，重新載入頁面
        window.location.reload();
      }
    });

    // 保險機制：如果 3 秒後還沒重新載入，強制重新載入
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  /**
   * 忽略此次更新提示
   */
  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    isUpdating,
    updateApp,
    dismissUpdate,
  };
}
