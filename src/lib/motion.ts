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

/** 摺疊區塊（篩選面板等）：高度由 0 展開，overflow 需由呼叫端設為 hidden */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: DURATION.slow, ease: EASE_OUT } },
  exit: { height: 0, opacity: 0, transition: { duration: DURATION.base, ease: EASE_IN } },
};

/** 清單容器：只負責 stagger，子項目使用 listItem */
export const listContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_BASE },
  exit: { opacity: 0, scale: 0.97, transition: TRANSITION_EXIT },
};

/** stagger 只套用前幾筆，避免長清單初次載入時等待過久 */
export const STAGGER_LIMIT = 8;
