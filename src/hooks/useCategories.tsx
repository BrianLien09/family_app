'use client';

import { useState, useEffect, useCallback } from 'react';
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, db } from '@/lib/firebase';
import { DEFAULT_CATEGORIES } from '@/types';

function parseCategories(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()))]
    : [];
}

function readCategories(key: string): string[] {
  try {
    return parseCategories(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch (error) {
    console.error('讀取分類快取失敗：', error);
    return [];
  }
}

function cacheCategories(uid: string, categories: string[]) {
  try {
    localStorage.setItem('custom_categories_v2_' + uid, JSON.stringify(categories));
  } catch (error) {
    console.error('儲存分類快取失敗：', error);
  }
}

const getSettingsRef = () => doc(db, 'settings', 'category_presets');

function loadCachedCategories(): string[] {
  const uid = auth.currentUser?.uid;
  if (!uid || typeof window === 'undefined') return DEFAULT_CATEGORIES;
  const cached = readCategories('custom_categories_v2_' + uid);
  const legacy = readCategories('user_custom_categories');
  return [...new Set([...DEFAULT_CATEGORIES, ...cached, ...legacy])];
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(loadCachedCategories);

  useEffect(() => {
    let stopSnapshot: (() => void) | undefined;
    let generation = 0;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      stopSnapshot?.();
      const currentGeneration = ++generation;
      if (!user) {
        setCategories(DEFAULT_CATEGORIES);
        return;
      }

      const marker = 'custom_categories_migrated_' + user.uid;
      let legacy: string[] = [];
      try {
        if (!localStorage.getItem(marker)) legacy = readCategories('user_custom_categories').filter(item => !DEFAULT_CATEGORIES.includes(item));
      } catch (error) {
        console.error('讀取分類移轉狀態失敗：', error);
      }
      setCategories([...new Set([...DEFAULT_CATEGORIES, ...readCategories('custom_categories_v2_' + user.uid), ...legacy])]);
      let migrationAttempted = false;
      let migrationComplete = legacy.length === 0;
      const isCurrent = () => generation === currentGeneration && auth.currentUser?.uid === user.uid;

      stopSnapshot = onSnapshot(getSettingsRef(), { includeMetadataChanges: true }, (snapshot) => {
        if (!isCurrent() || snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
        const remote = parseCategories(snapshot.data()?.customCategories);
        const merged = [...new Set([...DEFAULT_CATEGORIES, ...remote, ...(migrationComplete ? [] : legacy)])];
        setCategories(merged);
        cacheCategories(user.uid, merged);

        // 每個帳號只合併一次舊本機分類，避免已刪除的分類在重登入後復活。
        if (!snapshot.metadata.fromCache && !migrationAttempted) {
          migrationAttempted = true;
          const migrate = async () => {
            try {
              if (legacy.length > 0) await setDoc(getSettingsRef(), { customCategories: arrayUnion(...legacy) }, { merge: true });
              if (isCurrent()) {
                migrationComplete = true;
                try {
                  localStorage.setItem(marker, 'true');
                  localStorage.removeItem('user_custom_categories');
                } catch (error) {
                  console.error('儲存分類移轉狀態失敗：', error);
                }
              }
            } catch (error) {
              console.error('同步舊分類失敗：', error);
              toast.error('舊分類同步失敗，請重新登入後重試');
            }
          };
          void migrate();
        }
      }, (error) => {
        if (!isCurrent()) return;
        console.error('分類即時同步失敗：', error);
        toast.error('分類同步失敗，目前保留本機分類');
      });
    });
    return () => {
      generation += 1;
      unsubscribeAuth();
      stopSnapshot?.();
    };
  }, []);

  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!auth.currentUser) { toast.error('請先登入才能修改分類'); return false; }
    if (!trimmed) { toast.error('類別名稱不可為空'); return false; }
    if (categories.includes(trimmed)) { toast.error('此類別已存在'); return false; }
    try {
      await setDoc(getSettingsRef(), { customCategories: arrayUnion(trimmed) }, { merge: true });
      toast.success('已新增類別：' + trimmed);
      return true;
    } catch (error) {
      console.error('新增分類失敗：', error);
      toast.error('新增分類失敗，請重試');
      return false;
    }
  }, [categories]);

  const deleteCategory = useCallback(async (category: string): Promise<boolean> => {
    if (!auth.currentUser) { toast.error('請先登入才能修改分類'); return false; }
    if (DEFAULT_CATEGORIES.includes(category)) { toast.error('預設類別無法刪除'); return false; }
    try {
      await setDoc(getSettingsRef(), { customCategories: arrayRemove(category) }, { merge: true });
      toast.success('已刪除類別：' + category);
      return true;
    } catch (error) {
      console.error('刪除分類失敗：', error);
      toast.error('刪除分類失敗，請重試');
      return false;
    }
  }, []);

  return { categories, addCategory, deleteCategory, isDefaultCategory: (category: string) => DEFAULT_CATEGORIES.includes(category) };
}
