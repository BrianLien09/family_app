import { useSharedCollection } from '@/hooks/useSharedCollection';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '@/lib/firebase';
import { omitId } from '@/lib/object';
import { RestockItem, RestockPurchaseRecord } from '@/types';
import { getTodayDateString, normalizePurchaseHistory } from '@/lib/restock';

function sanitizePurchaseHistory(value: unknown): RestockPurchaseRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (
      typeof entry === 'object'
      && entry !== null
      && 'purchasedOn' in entry
      && typeof entry.purchasedOn === 'string'
    ) {
      return [{ purchasedOn: entry.purchasedOn }];
    }

    return [];
  });
}

function sanitizeRestockItem(id: string, raw: Record<string, unknown>): RestockItem {
  const lastPurchasedOn = typeof raw.lastPurchasedOn === 'string'
    ? raw.lastPurchasedOn
    : getTodayDateString();
  const purchaseHistory = normalizePurchaseHistory(
    sanitizePurchaseHistory(raw.purchaseHistory),
    lastPurchasedOn,
  );

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '\u672a\u547d\u540d\u7269\u54c1',
    currentStock: typeof raw.currentStock === 'number' && raw.currentStock >= 0
      ? raw.currentStock
      : undefined,
    stockUnit: typeof raw.stockUnit === 'string' && raw.stockUnit.trim()
      ? raw.stockUnit.trim()
      : undefined,
    lowStockThreshold: typeof raw.lowStockThreshold === 'number' && raw.lowStockThreshold >= 0
      ? raw.lowStockThreshold
      : undefined,
    restockAmount: typeof raw.restockAmount === 'number' && raw.restockAmount > 0
      ? raw.restockAmount
      : undefined,
    targetIntervalDays: typeof raw.targetIntervalDays === 'number' && raw.targetIntervalDays > 0
      ? raw.targetIntervalDays
      : 30,
    lastPurchasedOn,
    purchaseHistory,
    lastNotifiedDueOn: typeof raw.lastNotifiedDueOn === 'string' ? raw.lastNotifiedDueOn : '',
    note: typeof raw.note === 'string' ? raw.note : '',
  };
}

const collectionOptions = {
  collectionName: 'restockItems',
  cachePrefix: 'restock_cache_v1_',
  orderField: 'name',
  orderDirection: 'asc' as const,
  deserialize: sanitizeRestockItem,
};

export function useRestockItems() {
  const { data: items, setData: setItems, isLoaded, isRefreshing, refresh, updateCache, restoreData } = useSharedCollection<RestockItem>(collectionOptions);

  const addItem = async (newItem: Omit<RestockItem, 'id'>) => {
    if (!auth.currentUser) {
      toast.error('\u8acb\u5148\u767b\u5165\u624d\u80fd\u65b0\u589e\u88dc\u8ca8\u9805\u76ee');
      return false;
    }

    const normalizedItem: Omit<RestockItem, 'id'> = {
      ...newItem,
      purchaseHistory: normalizePurchaseHistory(newItem.purchaseHistory, newItem.lastPurchasedOn),
      lastNotifiedDueOn: newItem.lastNotifiedDueOn ?? '',
      note: newItem.note?.trim() ?? '',
    };

    try {
      const docRef = await addDoc(collection(db, 'restockItems'), {
        ...normalizedItem,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedItem: RestockItem = { ...normalizedItem, id: docRef.id };

      setItems((prev) => {
        const nextItems = [...prev.filter(item => item.id !== savedItem.id), savedItem].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hant'));
        updateCache(nextItems);
        return nextItems;
      });

      toast.success('\u88dc\u8ca8\u9805\u76ee\u5df2\u52a0\u5165\u6e05\u55ae');
      return true;
    } catch (error) {
      console.error('Failed to add restock item', error);
      toast.error('\u65b0\u589e\u88dc\u8ca8\u9805\u76ee\u5931\u6557');
      return false;
    }
  };

  const updateItem = async (id: string, updatedFields: Partial<Omit<RestockItem, 'id'>>) => {
    if (!auth.currentUser) {
      toast.error('\u8acb\u5148\u767b\u5165\u624d\u80fd\u66f4\u65b0\u88dc\u8ca8\u9805\u76ee');
      return false;
    }

    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) {
      return false;
    }

    const lastPurchasedOn = updatedFields.lastPurchasedOn ?? currentItem.lastPurchasedOn;
    const purchaseHistory = updatedFields.purchaseHistory
      ? normalizePurchaseHistory(updatedFields.purchaseHistory, lastPurchasedOn)
      : normalizePurchaseHistory(currentItem.purchaseHistory, lastPurchasedOn);

    const payload = {
      ...updatedFields,
      lastPurchasedOn,
      purchaseHistory,
      note: updatedFields.note?.trim() ?? currentItem.note ?? '',
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, 'restockItems', id), payload);

      setItems((prev) => {
        const nextItems = prev
          .map((item) => (
            item.id === id
              ? {
                  ...item,
                  ...updatedFields,
                  lastPurchasedOn,
                  purchaseHistory,
                  note: payload.note,
                }
              : item
          ))
          .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hant'));

        updateCache(nextItems);
        return nextItems;
      });

      toast.success('\u88dc\u8ca8\u9805\u76ee\u5df2\u66f4\u65b0');
      return true;
    } catch (error) {
      console.error('Failed to update restock item', error);
      toast.error('\u66f4\u65b0\u88dc\u8ca8\u9805\u76ee\u5931\u6557');
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!auth.currentUser) {
      return;
    }

    const itemToDelete = items.find((item) => item.id === id);
    if (!itemToDelete) {
      return;
    }


    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      updateCache(nextItems);
      return nextItems;
    });

    try {
      await deleteDoc(doc(db, 'restockItems', id));

      toast((toastItem) => (
        <div className="flex items-center gap-3">
          <span>{`\u5df2\u522a\u9664 ${itemToDelete.name}`}</span>
          <button
            onClick={async () => {
              toast.dismiss(toastItem.id);

              try {
                const dataToRestore = omitId(itemToDelete);
                const docRef = await addDoc(collection(db, 'restockItems'), {
                  ...dataToRestore,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });

                setItems((prev) => {
                  const restoredItem: RestockItem = { ...dataToRestore, id: docRef.id };
                  const nextItems = [...prev.filter(item => item.id !== restoredItem.id), restoredItem].sort((left, right) => (
                    left.name.localeCompare(right.name, 'zh-Hant')
                  ));
                  updateCache(nextItems);
                  return nextItems;
                });

                toast.success('\u88dc\u8ca8\u9805\u76ee\u5df2\u5fa9\u539f');
              } catch (error) {
                console.error('Failed to restore restock item', error);
                toast.error('\u88dc\u8ca8\u9805\u76ee\u5fa9\u539f\u5931\u6557');
              }
            }}
            className="rounded-md bg-[#5f7186] px-3 py-1 text-sm font-semibold text-[#f0ece1] transition-all duration-200 hover:bg-[#47576b]"
          >
            {'\u5fa9\u539f'}
          </button>
        </div>
      ), {
        duration: 5000,
        id: `delete-restock-${id}`,
      });
    } catch (error) {
      console.error('Failed to delete restock item', error);
      toast.error('\u522a\u9664\u88dc\u8ca8\u9805\u76ee\u5931\u6557');
      restoreData();
    }
  };

  const markPurchased = async (id: string, purchasedOn: string = getTodayDateString()) => {
    if (!auth.currentUser) {
      toast.error('\u8acb\u5148\u767b\u5165\u624d\u80fd\u8a18\u9304\u88dc\u8ca8');
      return;
    }

    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) {
      return;
    }

    const purchaseHistory = normalizePurchaseHistory(currentItem.purchaseHistory, purchasedOn);
    const nextStock = currentItem.currentStock === undefined
      ? undefined
      : currentItem.currentStock + (currentItem.restockAmount ?? 1);

    try {
      await updateDoc(doc(db, 'restockItems', id), {
        lastPurchasedOn: purchasedOn,
        purchaseHistory,
        lastNotifiedDueOn: '',
        ...(nextStock === undefined ? {} : { currentStock: nextStock }),
        updatedAt: new Date(),
      });

      setItems((prev) => {
        const nextItems = prev
          .map((item) => (
            item.id === id
              ? {
                  ...item,
                  lastPurchasedOn: purchasedOn,
                  purchaseHistory,
                  lastNotifiedDueOn: '',
                  ...(nextStock === undefined ? {} : { currentStock: nextStock }),
                }
              : item
          ))
          .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hant'));

        updateCache(nextItems);
        return nextItems;
      });

      toast.success(nextStock === undefined
        ? `\u5df2\u8a18\u9304 ${currentItem.name} \u7684\u88dc\u8ca8\u65e5\u671f`
        : `\u5df2\u88dc\u8ca8\uff0c${currentItem.name} \u5eab\u5b58\u5df2\u66f4\u65b0`);
    } catch (error) {
      console.error('Failed to mark restock item as purchased', error);
      toast.error('\u8a18\u9304\u88dc\u8ca8\u5931\u6557');
    }
  };

  const adjustStock = async (id: string, adjustment: number) => {
    if (!auth.currentUser) {
      toast.error('\u8acb\u5148\u767b\u5165\u624d\u80fd\u66f4\u65b0\u5eab\u5b58');
      return;
    }

    const currentItem = items.find((item) => item.id === id);
    if (!currentItem || currentItem.currentStock === undefined) {
      return;
    }

    const nextStock = currentItem.currentStock + adjustment;
    if (nextStock < 0) {
      toast.error('\u5eab\u5b58\u4e0d\u80fd\u4f4e\u65bc 0');
      return;
    }

    setItems((prev) => {
      const nextItems = prev.map((item) => (
        item.id === id ? { ...item, currentStock: nextStock } : item
      ));
      updateCache(nextItems);
      return nextItems;
    });

    try {
      await updateDoc(doc(db, 'restockItems', id), {
        currentStock: nextStock,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to adjust stock', error);
      toast.error('\u66f4\u65b0\u5eab\u5b58\u5931\u6557');
      restoreData();
    }
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    markPurchased,
    adjustStock,
    isLoaded,
    isRefreshing,
    refresh,
  };
}
