import type { Transition, Variants } from 'motion/react';

/**
 * 全站動畫 token。
 * 為什麼集中管理：過去 duration 有 150/200/300/500/700 五種、easing 有四種，
 * 手感不一致；統一後整站的進出場節奏才會一致，日後調整只需改這裡。
 */

// 快速啟動、緩慢收尾的 expo-out 曲線，適合進場與面板展開
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
// 離場用較短、較俐落的曲線，避免使用者等待
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const TRANSITION_BASE: Transition = { duration: DURATION.base, ease: EASE_OUT };
export const TRANSITION_EXIT: Transition = { duration: DURATION.fast, ease: EASE_IN };

// 彈性回饋：用於 layoutId 滑動底板與選取狀態，避免生硬的線性位移
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };

// 按壓回饋統一為 0.97，取代過去 scale-95／.98／[0.98] 並存的情況
export const TAP_SCALE = { scale: 0.97 } as const;

// 卡片 hover 只上浮 2px：Woven & Weft 是安靜的織物質感，位移過大會像在跳動
export const HOVER_LIFT = { y: -2 } as const;
// 浮動按鈕（FAB）面積小，改用輕微放大提示可點擊
export const HOVER_GROW = { scale: 1.06 } as const;

/** 頁面或區塊進場：只用透明度與極小位移，避免影響操作 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, transition: TRANSITION_EXIT },
};

/** 浮出的卡片／工具列：輕微縮放加淡入 */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, scale: 0.98, transition: TRANSITION_EXIT },
};

/**
 * 摺疊區塊（篩選面板、條件表單欄位）：高度由 0 展開。
 * 為什麼由 variants 控制 overflow：動畫期間必須 hidden 才不會露出內容，
 * 但展開後若仍 hidden，輸入框的 focus 外框（outline-offset）會被裁掉，所以結束時改回 visible。
 */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0, overflow: 'hidden' },
  visible: {
    height: 'auto',
    opacity: 1,
    overflow: 'hidden',
    transition: { duration: DURATION.slow, ease: EASE_OUT },
    transitionEnd: { overflow: 'visible' },
  },
  exit: { height: 0, opacity: 0, overflow: 'hidden', transition: { duration: DURATION.base, ease: EASE_IN } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, scale: 0.97, transition: TRANSITION_EXIT },
};

/**
 * 同一位置的內容替換（空狀態↔清單、計算結果、標籤文字）。
 * 為什麼不用 popIn：同一張卡片內換內容若整塊縮放彈出會「閃眼睛」，只做淡入加 4px 位移較順。
 */
export const crossFade: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, y: -4, transition: TRANSITION_EXIT },
};

/**
 * 依方向水平滑動（月份、分頁）。搭配 AnimatePresence 的 custom 傳入 1／-1，
 * 讓正在離場的舊內容也能拿到最新方向；距離由呼叫端決定（文字小、格子大）。
 */
export function slideX(distance: number): Variants {
  return {
    enter: (direction: number) => ({ opacity: 0, x: direction * distance }),
    center: { opacity: 1, x: 0, transition: TRANSITION_BASE },
    leave: (direction: number) => ({ opacity: 0, x: direction * -distance, transition: TRANSITION_EXIT }),
  };
}
