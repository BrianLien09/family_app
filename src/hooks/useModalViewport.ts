'use client';

import { useEffect, type RefObject } from 'react';

/**
 * 將手機瀏覽器的可視區域同步到對話框容器，避免鍵盤只縮小視口卻不改變版面高度。
 */
export function useModalViewport<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) return;

    const visualViewport = window.visualViewport;
    let animationFrameId: number | null = null;
    let previousHeight = Number.NaN;
    let previousOffsetTop = Number.NaN;

    const updateViewport = () => {
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportOffsetTop = visualViewport?.offsetTop ?? 0;
      const height = Number.isFinite(viewportHeight) && viewportHeight > 0
        ? viewportHeight
        : window.innerHeight;
      const offsetTop = Number.isFinite(viewportOffsetTop) ? viewportOffsetTop : 0;

      if (height === previousHeight && offsetTop === previousOffsetTop) return;

      element.style.setProperty('--modal-viewport-height', `${height}px`);
      element.style.setProperty('--modal-viewport-top', `${offsetTop}px`);
      previousHeight = height;
      previousOffsetTop = offsetTop;
    };

    const scheduleViewportUpdate = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateViewport();
      });
    };

    updateViewport();
    visualViewport?.addEventListener('resize', scheduleViewportUpdate);
    visualViewport?.addEventListener('scroll', scheduleViewportUpdate);
    window.addEventListener('resize', scheduleViewportUpdate);

    return () => {
      visualViewport?.removeEventListener('resize', scheduleViewportUpdate);
      visualViewport?.removeEventListener('scroll', scheduleViewportUpdate);
      window.removeEventListener('resize', scheduleViewportUpdate);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      element.style.removeProperty('--modal-viewport-height');
      element.style.removeProperty('--modal-viewport-top');
    };
  }, [elementRef, enabled]);
}
