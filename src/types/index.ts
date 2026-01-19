// 預設類別（使用者可自行新增更多）
export type DateCategory = string;

export const DEFAULT_CATEGORIES: string[] = ['阿弟排班', '孔呆值班', '剪頭髮', '洗牙', '聚餐', '繳費', '其它'];

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
}
