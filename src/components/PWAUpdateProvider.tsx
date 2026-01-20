// src/components/PWAUpdateProvider.tsx
'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import UpdatePrompt from './UpdatePrompt';

/**
 * PWA 更新提示提供者
 * 
 * 這是一個 Client Component，負責：
 * 1. 監聽 Service Worker 更新
 * 2. 顯示更新提示 UI
 * 3. 處理使用者的更新/忽略操作
 */
export default function PWAUpdateProvider() {
  const { updateAvailable, isUpdating, updateApp, dismissUpdate } = useServiceWorker();

  // 只在有更新可用時才渲染提示
  if (!updateAvailable) {
    return null;
  }

  return (
    <UpdatePrompt 
      onUpdate={updateApp} 
      onDismiss={dismissUpdate}
      isUpdating={isUpdating}
    />
  );
}
