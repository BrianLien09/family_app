// src/components/CapybaraLoader.tsx
// 可愛的水豚載入動畫元件，用於全頁或區塊載入狀態
// 靈感來源: Uiverse.io by Novaxlo

import styles from './CapybaraLoader.module.css';

interface CapybaraLoaderProps {
  /** 是否以全頁遮罩方式顯示，預設 true */
  fullScreen?: boolean;
  /** 載入提示文字，預設「載入中...」 */
  label?: string;
}

export default function CapybaraLoader({
  fullScreen = true,
  label = '載入中...',
}: CapybaraLoaderProps) {
  const inner = (
    <div className="flex flex-col items-center gap-4">
      <div className={styles.capybaraloader}>
        <div className={styles.capybara}>
          <div className={styles.capyhead}>
            <div className={styles.capyear}>
              <div className={styles.capyear2}></div>
            </div>
            <div className={styles.capyear}></div>
            <div className={styles.capymouth}>
              <div className={styles.capylips}></div>
              <div className={styles.capylips}></div>
            </div>
            <div className={styles.capyeye}></div>
            <div className={styles.capyeye}></div>
          </div>
          <div className={styles.capyleg}></div>
          <div className={styles.capyleg2}></div>
          <div className={styles.capyleg2}></div>
          <div className={styles.capy}></div>
        </div>
        <div className={styles.loader}>
          <div className={styles.loaderline}></div>
        </div>
      </div>

      {/* 載入文字 */}
      {label && (
        <p className="text-[#5f6368] text-sm tracking-wide animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  // 全頁遮罩模式：固定定位並置中
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#e6e2d8]">
        {inner}
      </div>
    );
  }

  // 區塊模式：佔滿父容器高度
  return (
    <div className="min-h-screen flex items-center justify-center">
      {inner}
    </div>
  );
}
