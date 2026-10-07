import { useEffect } from 'react';

const immersiveOwners = new Set<symbol>();
let previousOverflow = '';

export function useImmersiveMode(enable: boolean) {
  useEffect(() => {
    if (!enable) return;
    const owner = Symbol('immersive');
    if (immersiveOwners.size === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.dataset.immersive = 'true';
    }
    immersiveOwners.add(owner);

    return () => {
      immersiveOwners.delete(owner);
      // 多個沉浸視窗共用鎖定，最後一個關閉後才還原頁面。
      if (immersiveOwners.size === 0) {
        document.body.style.overflow = previousOverflow;
        delete document.body.dataset.immersive;
      }
    };
  }, [enable]);
}
