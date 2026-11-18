'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
  Cake, CalendarClock, Car, Check, GraduationCap, Plane, Receipt, Scissors, ShieldCheck,
  ShoppingBag, Smile, Stethoscope, Tag, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import { CategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';

interface CategoryPickerProps {
  categories: readonly string[];
  value: string;
  onChange: (category: string) => void;
  categoryColors: CategoryColorMap;
  /** 放在最後的額外操作（例如「自訂類別」），與分類膠囊同高度排列 */
  trailing?: ReactNode;
}

// 分類是使用者自訂的字串，無法逐一指定圖示；改用關鍵字比對，新分類只要名稱貼近就能自動拿到合適圖示
const ICON_RULES: readonly { keywords: readonly string[]; icon: LucideIcon }[] = [
  { keywords: ['排班', '上班', '班表'], icon: CalendarClock },
  { keywords: ['值班'], icon: ShieldCheck },
  { keywords: ['髮', '美容'], icon: Scissors },
  { keywords: ['牙'], icon: Smile },
  { keywords: ['醫', '診', '看病', '檢查'], icon: Stethoscope },
  { keywords: ['餐', '吃', '飯', '聚'], icon: UtensilsCrossed },
  { keywords: ['繳', '費', '帳', '款'], icon: Receipt },
  { keywords: ['生日', '紀念'], icon: Cake },
  { keywords: ['學', '課', '考'], icon: GraduationCap },
  { keywords: ['旅', '玩', '出國'], icon: Plane },
  { keywords: ['買', '購'], icon: ShoppingBag },
  { keywords: ['車', '接送'], icon: Car },
];

export function getCategoryIcon(category: string): LucideIcon {
  return ICON_RULES.find(rule => rule.keywords.some(keyword => category.includes(keyword)))?.icon ?? Tag;
}

/**
 * 行程分類選擇器：每個分類以圖示＋專屬色呈現。
 * 為什麼沿用月曆的分類色：使用者在這裡選的顏色，就是存檔後在首頁月曆看到的顏色，
 * 選擇時就能建立「顏色＝分類」的對應，比全部都是同色膠囊更容易一眼找到。
 */
export default function CategoryPicker({ categories, value, onChange, categoryColors, trailing }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="行程分類">
      {categories.map(category => {
        const isSelected = category === value;
        const styles = getCategoryColorStyles(category, categoryColors);
        const accent = styles.dot.backgroundColor;
        const Icon = getCategoryIcon(category);

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            aria-pressed={isSelected}
            aria-label={`分類: ${category}`}
            className={clsx(
              // 膠囊寬度隨文字收縮，比固定欄寬的方塊省空間；高度仍維持 44px 觸控標準
              'relative inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-3.5 text-left text-sm transition-colors duration-fast ease-out-expo',
              isSelected ? 'font-bold' : 'border-dashed border-[#dcd0c2] bg-[#f0ece1] font-medium text-[#3d3a36] hover:bg-[#dcd0c2]/30',
            )}
            // 選取時改用分類本身的色票；拆成非縮寫屬性，避免 React 動態更新 style 時發生衝突
            style={isSelected ? { backgroundColor: styles.badge.backgroundColor, borderColor: accent, color: styles.badge.color } : undefined}
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#f0ece1]"
              style={{ backgroundColor: accent }}
            >
              <Icon size={14} />
            </span>
            <span className="min-w-0 break-words leading-snug">{category}</span>
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[#f0ece1] shadow-[0_2px_6px_rgba(61,58,54,0.2)]"
                style={{ backgroundColor: accent }}
              >
                <Check size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
