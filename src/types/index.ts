// 預設類別（使用者可自行新增更多）
export type DateCategory = string;

export const DEFAULT_CATEGORIES: string[] = ['阿弟排班', '孔呆值班', '剪頭髮', '洗牙', '聚餐', '繳費', '其它'];

// 子分類（例如阿弟排班 → 週六班 / 週日班），各自有獨立預設時間
export interface SubCategoryPreset {
  startTime: string; // HH:mm
  endTime?: string;  // HH:mm（選填）
}

// 單一分類的時間預設設定
export interface CategoryTimePreset {
  // 一般預設：最後一次成功送出時的時間
  defaultStartTime?: string;
  defaultEndTime?: string;
  // 用 Array 保留插入順序 — Record (物件) 在 Firestore 往返後不保證 key 排序
  subCategories?: Array<{ name: string } & SubCategoryPreset>;
}

// LocalStorage 整體儲存格式：key 為分類名稱
export type CategoryTimePresets = Record<string, CategoryTimePreset>;

export interface DateItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (選填 - 開始時間)
  endTime?: string; // HH:mm (選填 - 結束時間)
  category: DateCategory;
  description?: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  baseServings: number; 
  ingredients: RecipeIngredient[];
  cookingTime?: {
    value: number;
    unit: string;
    minutes: number;
  } | null;
}

// 家庭成員定義（順序即為顯示順序）
export const FAMILY_MEMBERS = ['Sandy', 'Brian', 'Mango', '孔呆', '共同'] as const;
export type FamilyMember = typeof FAMILY_MEMBERS[number];

// 家庭成員顏色對應（用於圖表與 UI）
export const MEMBER_COLORS: Record<FamilyMember, string> = {
  Sandy: '#fb7185',   // rose-400
  Brian: '#818cf8',   // indigo-400
  Mango: '#fbbf24',   // amber-400
  孔呆: '#2dd4bf',   // teal-400
  共同: '#c084fc',   // purple-400
};

// 支出分類
export const EXPENSE_CATEGORIES = [
  '餐費', '交通', '購物', '醫療', '娛樂',
  '水電費', '房租', '通訊', '教育', '其它'
] as const;

// 收入分類
export const INCOME_CATEGORIES = [
  '薪水', '獎金', '投資', '回饋', '其它'
] as const;

// 單筆帳本記錄
export interface ExpenseItem {
  id: string;
  type: 'income' | 'expense';  // 收入或支出
  amount: number;               // 金額（台幣整數）
  category: string;             // 分類
  member: FamilyMember;         // 誰的消費
  description?: string;         // 備註（選填）
  date: string;                 // YYYY-MM-DD
}
