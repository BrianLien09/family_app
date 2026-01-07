import { useEffect } from 'react';

export function useImmersiveMode(enable: boolean) {
  useEffect(() => {
    if (!enable) return;

    // 1. 鎖定滾動，避免背景滑動
    document.body.style.overflow = 'hidden';

    // 2. 抓取導航列
    const navbar = document.getElementById('navbar');

    if (navbar) {
      // 記錄原本的樣式 (以免把 transition 弄壞)
      const originalTransition = navbar.style.transition;
      const originalTransform = navbar.style.transform;

      // 強制隱藏 (加上 !important 確保權重)
      navbar.style.cssText = `
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        transform: translateY(-100%) !important;
      `;

      // 3. 清理函式：元件關閉時執行
      return () => {
        document.body.style.overflow = 'unset'; // 解鎖滾動
        
        // 復原樣式
        navbar.style.cssText = ''; 
        // 讓 Navbar 透過原本的 class 控制是否顯示
        // 如果原本是顯示的，移除 style 後它就會滑回來
      };
    } else {
      // 找不到導航列，至少也要復原滾動
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [enable]);
}