'use client';

import { collection, doc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useSharedCollection } from '@/hooks/useSharedCollection';
import { auth, db } from '@/lib/firebase';
import { deserializePurchase, isPurchaseInput, PHONE_MEMORY, PHONE_STORAGE, PURCHASE_CATEGORIES, PURCHASE_PLATFORMS, PurchaseInput } from '@/lib/purchases';

const purchaseOptions = {
  collectionName: 'purchases', cachePrefix: 'purchase_cache_v2_', orderField: 'date',
  orderDirection: 'desc' as const, deserialize: deserializePurchase,
};
const categoryOptions = {
  collectionName: 'purchaseCategories', cachePrefix: 'purchase_category_cache_v1_', orderField: 'name',
  orderDirection: 'asc' as const,
  deserialize: (id: string, data: Record<string, unknown>) => ({ id, name: typeof data.name === 'string' ? data.name : '' }),
};

export function usePurchases() {
  const records = useSharedCollection(purchaseOptions);
  const catalog = useSharedCollection(categoryOptions);
  const categories = [...new Set([...PURCHASE_CATEGORIES, ...catalog.data.map(item => item.name), ...records.data.map(item => item.category)])].filter(Boolean);
  const choiceOptions = {
    platforms: [...new Set([...PURCHASE_PLATFORMS, ...records.data.map(item => item.platform)])].filter(Boolean),
    memories: [...new Set([...PHONE_MEMORY, ...records.data.map(item => item.memory).filter((value): value is string => Boolean(value))])],
    storages: [...new Set([...PHONE_STORAGE, ...records.data.map(item => item.storage).filter((value): value is string => Boolean(value))])],
  };

  const savePurchase = async (data: PurchaseInput, id?: string): Promise<boolean> => {
    if (!auth.currentUser) { toast.error('請先登入才能儲存購買紀錄'); return false; }
    if (!isPurchaseInput(data)) { toast.error('請確認必填欄位，並填入至少一種幣別的有效金額'); return false; }
    try {
      const batch = writeBatch(db);
      const reference = id ? doc(db, 'purchases', id) : doc(collection(db, 'purchases'));
      const payload = { ...data, memory: data.category === '手機' ? data.memory : null, storage: data.category === '手機' ? data.storage : null, updatedAt: serverTimestamp() };
      if (id) batch.update(reference, payload);
      else batch.set(reference, { ...payload, createdAt: serverTimestamp() });
      // 分類與紀錄一起提交，避免只存到其中一項。
      if (!categories.includes(data.category)) {
        batch.set(doc(db, 'purchaseCategories', encodeURIComponent(data.category)), { name: data.category });
      }
      await batch.commit();
      toast.success(id ? '購買紀錄已更新' : '購買紀錄已新增');
      return true;
    } catch (error) {
      console.error('儲存購買紀錄失敗：', error);
      toast.error('儲存失敗，請確認網路與資料存取權限');
      return false;
    }
  };
  const deletePurchase = async (id: string): Promise<boolean> => {
    if (!auth.currentUser) { toast.error('請先登入才能刪除紀錄'); return false; }
    try {
      await deleteDoc(doc(db, 'purchases', id));
      toast.success('購買紀錄已刪除');
      return true;
    } catch (error) {
      console.error('刪除購買紀錄失敗：', error);
      toast.error('刪除失敗，請稍後重試');
      return false;
    }
  };
  return { items: records.data, categories, choiceOptions, savePurchase, deletePurchase, hasSyncError: records.hasSyncError || catalog.hasSyncError, isLoaded: records.isLoaded && catalog.isLoaded, isRefreshing: records.isRefreshing || catalog.isRefreshing, refresh: () => { records.refresh(); catalog.refresh(); } };
}
