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
