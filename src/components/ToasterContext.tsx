// src/components/ToasterContext.tsx
'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterContext() {
  return (
    <Toaster 
      position="bottom-right" // 你可以改 'top-center', 'bottom-center' 等
      toastOptions={{
        // 設定預設樣式
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
        },
        success: {
          iconTheme: {
            primary: '#4ade80', // 綠色
            secondary: 'black',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // 紅色
            secondary: 'black',
          },
        },
      }}
    />
  );
}