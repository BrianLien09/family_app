'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { db, auth } from '@/lib/firebase';
import { CategoryTimePreset, CategoryTimePresets, SubCategoryPreset } from '@/types';

type SubCategoryEntry = { name: string } & SubCategoryPreset;
const getSettingsRef = () => doc(db, 'settings', 'category_presets');

function migrateAllPresets(raw: CategoryTimePresets): CategoryTimePresets {
  return Object.fromEntries(Object.entries(raw).map(([category, preset]) => {
    const subCategories = preset.subCategories;
    if (!subCategories || Array.isArray(subCategories)) return [category, preset];
    // 舊版以物件儲存子分類，讀取後統一為陣列。
    const entries = subCategories as unknown as Record<string, SubCategoryPreset>;
    return [category, { ...preset, subCategories: Object.entries(entries).map(([name, sub]) => ({ name, ...sub })) }];
  }));
}

function loadCachedPresets(): CategoryTimePresets {
  const uid = auth.currentUser?.uid;
  if (!uid || typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem('category_time_presets_v2_' + uid) ?? localStorage.getItem('category_time_presets_cache');
    return cached ? migrateAllPresets(JSON.parse(cached) as CategoryTimePresets) : {};
  } catch (error) {
    console.error('讀取分類時間快取失敗：', error);
    return {};
  }
}

export function useCategoryTimePresets() {
  const [presets, setPresets] = useState<CategoryTimePresets>(loadCachedPresets);

  useEffect(() => {
    let stopSnapshot: (() => void) | undefined;
    let generation = 0;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      stopSnapshot?.();
      const currentGeneration = ++generation;
      if (!user) { setPresets({}); return; }
      setPresets(loadCachedPresets());
      const cacheKey = 'category_time_presets_v2_' + user.uid;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) setPresets(migrateAllPresets(JSON.parse(cached) as CategoryTimePresets));
      } catch (error) {
        console.error('讀取分類時間快取失敗：', error);
      }
      stopSnapshot = onSnapshot(getSettingsRef(), { includeMetadataChanges: true }, (snapshot) => {
        if (generation !== currentGeneration || auth.currentUser?.uid !== user.uid || snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
        const remote = migrateAllPresets((snapshot.data()?.presets ?? {}) as CategoryTimePresets);
        setPresets(remote);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(remote));
        } catch (error) {
          console.error('儲存分類時間快取失敗：', error);
        }
      }, (error) => {
        if (generation !== currentGeneration) return;
        console.error('分類時間同步失敗：', error);
        toast.error('分類時間同步失敗，目前保留已載入設定');
      });
    });
    return () => {
      generation += 1;
      unsubscribeAuth();
      stopSnapshot?.();
    };
  }, []);

  async function persistCategory(category: string, update: (preset: CategoryTimePreset) => CategoryTimePreset): Promise<boolean> {
    if (!auth.currentUser) { toast.error('請先登入才能儲存分類時間'); return false; }
    try {
      await runTransaction(db, async (transaction) => {
        const ref = getSettingsRef();
        const snapshot = await transaction.get(ref);
        const current = migrateAllPresets((snapshot.data()?.presets ?? {}) as CategoryTimePresets);
        // 只修改這個分類，並以交易保留其他家人同時更新的設定。
        transaction.set(ref, { presets: { [category]: update(current[category] ?? {}) } }, { merge: true });
      });
      return true;
    } catch (error) {
      console.error('儲存分類時間失敗：', error);
      toast.error('分類時間儲存失敗，請重試');
      return false;
    }
  }

  function getDefaultTime(category: string): { startTime?: string; endTime?: string } {
    const preset = presets[category];
    return { startTime: preset?.defaultStartTime, endTime: preset?.defaultEndTime };
  }

  async function saveDefaultTime(category: string, startTime: string, endTime?: string) {
    return persistCategory(category, preset => ({ ...preset, defaultStartTime: startTime, defaultEndTime: endTime ?? '' }));
  }

  function getSubCategories(category: string): SubCategoryEntry[] {
    return presets[category]?.subCategories ?? [];
  }

  async function saveSubCategory(category: string, subName: string, startTime: string, endTime?: string) {
    const name = subName.trim();
    if (!name || !startTime) return false;
    return persistCategory(category, preset => {
      const existing = preset.subCategories ?? [];
      const entry: SubCategoryEntry = { name, startTime, ...(endTime ? { endTime } : {}) };
      return { ...preset, subCategories: existing.some(sub => sub.name === name)
        ? existing.map(sub => sub.name === name ? entry : sub)
        : [...existing, entry] };
    });
  }

  async function deleteSubCategory(category: string, subName: string) {
    return persistCategory(category, preset => ({ ...preset, subCategories: (preset.subCategories ?? []).filter(sub => sub.name !== subName) }));
  }

  return { getDefaultTime, saveDefaultTime, getSubCategories, saveSubCategory, deleteSubCategory };
}
