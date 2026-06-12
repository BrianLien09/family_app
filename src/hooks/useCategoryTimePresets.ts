// src/hooks/useCategoryTimePresets.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { CategoryTimePreset, CategoryTimePresets, SubCategoryPreset } from '@/types';

// LocalStorage 僅作為離線快取，Firestore 才是跨裝置的 Single Source of Truth
const CACHE_KEY = 'category_time_presets_cache';

// 全家共用一份設定（與 schedules collection 同樣邏輯）
const FIRESTORE_PATH = { collection: 'settings', doc: 'category_presets' };

// 子分類的完整型別（含 name）
type SubCategoryEntry = { name: string } & SubCategoryPreset;

function loadCache(): CategoryTimePresets {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as CategoryTimePresets) : {};
  } catch {
    return {};
  }
}

/**
 * 向下相容 migration：
 * 舊版 subCategories 是 Record<string, SubCategoryPreset>（物件格式）
 * 新版改為 Array，此函式在從 Firestore/快取讀取時自動轉換
 */
function migratePreset(preset: CategoryTimePreset): CategoryTimePreset {
  if (!preset.subCategories) return preset;

  // 已經是 Array 格式，直接回傳
  if (Array.isArray(preset.subCategories)) return preset;

  // 舊版物件格式 → 轉成 Array，插入順序由 Object.entries 決定（與舊電腦端一致）
  const asRecord = preset.subCategories as unknown as Record<string, SubCategoryPreset>;
  return {
    ...preset,
    subCategories: Object.entries(asRecord).map(([name, sub]) => ({ name, ...sub })),
  };
}

function migrateAllPresets(raw: CategoryTimePresets): CategoryTimePresets {
  return Object.fromEntries(
    Object.entries(raw).map(([cat, preset]) => [cat, migratePreset(preset)])
  );
}

/**
 * 管理分類時間預設與子分類設定的 Hook
 *
 * 架構：
 * - 初始值從 LocalStorage 快取載入（零延遲顯示）
 * - 登入後從 Firestore 同步最新資料（跨裝置一致）
 * - subCategories 使用 Array 儲存，保證插入順序在 Firestore 往返後不變
 */
export function useCategoryTimePresets() {
  const [presets, setPresets] = useState<CategoryTimePresets>(() =>
    migrateAllPresets(loadCache())
  );

  // 登入後從 Firestore 拉取最新設定，覆蓋本機快取
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const docRef = doc(db, FIRESTORE_PATH.collection, FIRESTORE_PATH.doc);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          // 從 Firestore 讀回時執行 migration，確保舊格式也能正確顯示
          const remote = migrateAllPresets(snap.data().presets as CategoryTimePresets);
          setPresets(remote);
          localStorage.setItem(CACHE_KEY, JSON.stringify(remote));
        }
      } catch (error) {
        console.error('讀取分類預設失敗，使用本機快取：', error);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * 同時更新 LocalStorage 快取（即時）＋ Firestore（跨裝置）
   */
  async function persist(updated: CategoryTimePresets) {
    setPresets(updated);

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch {
      // 快取失敗不影響主流程
    }

    try {
      const docRef = doc(db, FIRESTORE_PATH.collection, FIRESTORE_PATH.doc);
      await setDoc(docRef, { presets: updated }, { merge: true });
    } catch (error) {
      console.error('儲存分類預設到 Firestore 失敗：', error);
    }
  }

  function getDefaultTime(category: string): { startTime?: string; endTime?: string } {
    const preset = presets[category];
    if (!preset) return {};
    return {
      startTime: preset.defaultStartTime,
      endTime: preset.defaultEndTime,
    };
  }

  async function saveDefaultTime(category: string, startTime: string, endTime?: string) {
    await persist({
      ...presets,
      [category]: {
        ...presets[category],
        defaultStartTime: startTime || undefined,
        defaultEndTime: endTime || undefined,
      },
    });
  }

  /**
   * 取得子分類清單，Array 格式保證順序
   */
  function getSubCategories(category: string): SubCategoryEntry[] {
    return presets[category]?.subCategories ?? [];
  }

  /**
   * 新增子分類（追加到末尾）或更新同名的子分類（原位更新，保留順序）
   */
  async function saveSubCategory(
    category: string,
    subName: string,
    startTime: string,
    endTime?: string
  ) {
    const trimmedName = subName.trim();
    if (!trimmedName || !startTime) return;

    const existing = presets[category]?.subCategories ?? [];
    const existingIdx = existing.findIndex(s => s.name === trimmedName);

    const updatedSubs: SubCategoryEntry[] =
      existingIdx >= 0
        ? // 已存在：原位更新，維持原本順序
          existing.map((s, i) =>
            i === existingIdx
              ? { name: trimmedName, startTime, endTime: endTime || undefined }
              : s
          )
        : // 新增：追加到末尾，保留插入順序
          [...existing, { name: trimmedName, startTime, endTime: endTime || undefined }];

    await persist({
      ...presets,
      [category]: {
        ...presets[category],
        subCategories: updatedSubs,
      },
    });
  }

  /**
   * 刪除指定子分類（filter 後順序不變）
   */
  async function deleteSubCategory(category: string, subName: string) {
    const existing = presets[category]?.subCategories ?? [];
    await persist({
      ...presets,
      [category]: {
        ...presets[category],
        subCategories: existing.filter(s => s.name !== subName),
      },
    });
  }

  return {
    getDefaultTime,
    saveDefaultTime,
    getSubCategories,
    saveSubCategory,
    deleteSubCategory,
  };
}
