'use client';

import { Toaster } from 'react-hot-toast';

/**
 * 全站提示訊息樣式。
 * 為什麼不再用深色：原本的 #333 與 Woven & Weft 的亮色大地色系脫節，
 * 改成與卡片相同的燕麥白底與虛線邊框，視覺才一致。
 */
export default function ToasterContext() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          backgroundColor: '#f0ece1',
          color: '#3d3a36',
          borderRadius: '16px',
          border: '2px dashed #dcd0c2',
          boxShadow: '0 8px 20px rgba(139, 121, 101, 0.12)',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#5f7186', secondary: '#f0ece1' },
        },
        error: {
          iconTheme: { primary: '#9b4436', secondary: '#f0ece1' },
        },
      }}
    />
  );
}
