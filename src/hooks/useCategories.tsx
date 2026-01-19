// src/hooks/useCategories.tsx
import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CATEGORIES } from '@/types';
import toast from 'react-hot-toast';

/**
 * 管理自訂類別的 Hook
 * 使用 LocalStorage 持久化儲存使用者自訂的類別
 */
export function useCategories() {
  const STORAGE_KEY = 'user_custom_categories';

  // 初始化類別清單（從 LocalStorage 讀取，或使用預設值）
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 確保預設類別都存在，並合併自訂類別
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
        return merged;
      }
    } catch (error) {
      console.error('讀取類別快取失敗:', error);
    }

    return DEFAULT_CATEGORIES;
  });

  // 同步到 LocalStorage
  const syncToStorage = useCallback((updatedCategories: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('儲存類別快取失敗:', error);
      toast.error('儲存類別失敗');
    }
  }, []);

  // 新增類別
  const addCategory = useCallback((newCategory: string) => {
    const trimmed = newCategory.trim();

    if (!trimmed) {
      toast.error('類別名稱不可為空');
      return false;
    }

    if (categories.includes(trimmed)) {
      toast.error('此類別已存在');
      return false;
    }

    const updated = [...categories, trimmed];
    setCategories(updated);
    syncToStorage(updated);
    toast.success(`已新增類別：${trimmed}`);
    return true;
  }, [categories, syncToStorage]);

  // 刪除類別（預設類別不可刪除）
  const deleteCategory = useCallback((categoryToDelete: string) => {
    if (DEFAULT_CATEGORIES.includes(categoryToDelete)) {
      toast.error('預設類別無法刪除');
      return false;
    }

    const updated = categories.filter(cat => cat !== categoryToDelete);
    setCategories(updated);
    syncToStorage(updated);
    toast.success(`已刪除類別：${categoryToDelete}`);
    return true;
  }, [categories, syncToStorage]);

  // 重置為預設類別
  const resetToDefault = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
    syncToStorage(DEFAULT_CATEGORIES);
    toast.success('已重置為預設類別');
  }, [syncToStorage]);

  return {
    categories,
    addCategory,
    deleteCategory,
    resetToDefault,
    isDefaultCategory: (category: string) => DEFAULT_CATEGORIES.includes(category)
  };
}
