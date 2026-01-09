export type DateCategory = '阿弟排班' | '孔呆值班' | '剪頭髮' | '洗牙' | '聚餐' | '繳費' | '其它';

export const CATEGORIES: DateCategory[] = ['阿弟排班', '孔呆值班', '剪頭髮', '洗牙', '聚餐', '繳費', '其它'];

export interface DateItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
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
