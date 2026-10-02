import { useSharedCollection } from '@/hooks/useSharedCollection';
// src/hooks/useDates.ts
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { omitId } from '@/lib/object';
import { DateItem } from '@/types';
import toast from 'react-hot-toast';

const collectionOptions = {
  collectionName: 'schedules',
  cachePrefix: 'schedule_cache_v2_',
  orderField: 'date',
  orderDirection: 'asc' as const,
  deserialize: (id: string, data: Record<string, unknown>): DateItem => ({ ...data, id, startTime: data.startTime || data.time } as DateItem),
};

export function useDates() {
  const { data: dates, setData: setDates, isLoaded, isRefreshing, refresh, updateCache, restoreData } = useSharedCollection<DateItem>(collectionOptions);

  const addDate = async (newItem: DateItem) => {
    if (!auth.currentUser) {
      toast.error("請先登入");
      return false;
    }
    try {
      const dataToSave = omitId(newItem);
      const docRef = await addDoc(collection(db, "schedules"), {
        ...dataToSave,
        createdAt: new Date()
      });

      const savedItem = { ...newItem, id: docRef.id };

      setDates(prev => {
        const newState = [...prev.filter(item => item.id !== savedItem.id), savedItem].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        // ✨ 同步寫入快取
        updateCache(newState);
        return newState;
      });

      toast.success("新增成功！🎉");
      return true;
    } catch (error) {
      console.error("Error adding: ", error);
      toast.error("新增失敗");
      return false;
    }
  };

  const deleteDate = async (id: string) => {
    if (!auth.currentUser) return;

    // 找到要刪除的項目，準備給 undo 用
    const itemToDelete = dates.find(item => item.id === id);
    if (!itemToDelete) return;


    // 樂觀更新：先從 UI 移除
    setDates(prev => {
      const newState = prev.filter(item => item.id !== id);
      updateCache(newState);
      return newState;
    });

    try {
      // 實際刪除 Firebase 資料
      await deleteDoc(doc(db, "schedules", id));

      // 顯示成功訊息與復原按鈕
      toast((t) => (
        <div className="flex items-center gap-3">
          <span>行程已刪除 👋</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              // 復原：重新新增回 Firebase
              try {
                const dataToRestore = omitId(itemToDelete);
                const docRef = await addDoc(collection(db, "schedules"), {
                  ...dataToRestore,
                  createdAt: new Date()
                });

                // 更新本地狀態
                setDates(prev => {
                  const restored = { ...itemToDelete, id: docRef.id };
                  const newState = [...prev.filter(item => item.id !== restored.id), restored].sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                  updateCache(newState);
                  return newState;
                });

                toast.success("已復原行程 ✨");
              } catch (error) {
                console.error("Undo failed:", error);
                toast.error("復原失敗");
              }
            }}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-[#f0ece1] text-sm font-semibold rounded-md transition-all duration-200"
          >
            復原
          </button>
        </div>
      ), {
        duration: 5000,
        id: `delete-${id}`,
      });

    } catch (error) {
      console.error("Error deleting: ", error);
      toast.error("刪除失敗");
      // 刪除失敗，回復狀態
      restoreData();
    }
  };

  const updateDate = async (id: string, updatedData: Partial<DateItem>) => {
    if (!auth.currentUser) return false;
    try {
      const dateRef = doc(db, "schedules", id);
      await updateDoc(dateRef, { ...updatedData });

      setDates(prev => {
        const newState = prev.map(item =>
          item.id === id ? { ...item, ...updatedData } : item
        );
        // ✨ 同步寫入快取
        updateCache(newState);
        return newState;
      });

      toast.success("更新完成！✨");
      return true;
    } catch (error) {
      console.error("Error updating: ", error);
      toast.error("更新失敗");
      return false;
    }
  };

  // 批次刪除
  const deleteDates = async (ids: string[]) => {
    if (!auth.currentUser) return;
    if (ids.length === 0) return;

    // 找到要刪除的項目
    const itemsToDelete = dates.filter(item => ids.includes(item.id));
    if (itemsToDelete.length === 0) return;


    // 樂觀更新：先從 UI 移除
    setDates(prev => {
      const newState = prev.filter(item => !ids.includes(item.id));
      updateCache(newState);
      return newState;
    });

    try {
      // 批次刪除 Firebase 資料
      await Promise.all(ids.map(id => deleteDoc(doc(db, "schedules", id))));

      // 顯示成功訊息
      toast.success(`已刪除 ${ids.length} 個行程 👋`);

    } catch (error) {
      console.error("Error batch deleting: ", error);
      toast.error("批次刪除失敗");
      // 刪除失敗，回復狀態
      restoreData();
    }
  };

  // 複製行程到其他日期
  const duplicateDate = async (sourceId: string, targetDateString: string) => {
    if (!auth.currentUser) {
      toast.error("請先登入");
      return;
    }

    const sourceEvent = dates.find(d => d.id === sourceId);
    if (!sourceEvent) {
      toast.error("找不到原始行程");
      return;
    }

    try {
      const dataToCopy = omitId(sourceEvent);
      const docRef = await addDoc(collection(db, "schedules"), {
        ...dataToCopy,
        date: targetDateString, // 只改變日期
        createdAt: new Date()
      });

      const duplicatedItem = { ...dataToCopy, id: docRef.id, date: targetDateString } as DateItem;

      setDates(prev => {
        const newState = [...prev.filter(item => item.id !== duplicatedItem.id), duplicatedItem].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        updateCache(newState);
        return newState;
      });

      toast.success(`已複製到 ${targetDateString} 🎉`);
    } catch (error) {
      console.error("Error duplicating: ", error);
      toast.error("複製失敗");
    }
  };

  // 批次新增行程到多個日期
  const addDateToMultipleDates = async (dateStrings: string[], eventData: Omit<DateItem, 'id'>) => {
    if (!auth.currentUser) {
      toast.error("請先登入");
      return false;
    }

    if (dateStrings.length === 0) {
      toast.error("請先選擇日期");
      return false;
    }

    try {
      const batch = writeBatch(db);
      const uniqueDates = [...new Set(dateStrings)];
      const docRefs = uniqueDates.map(dateString => {
        const ref = doc(collection(db, "schedules"));
        batch.set(ref, {
          ...eventData,
          date: dateString,
          createdAt: new Date()
        });
        return ref;
      });

      // 整批成功才確認，避免部分成功後重試造成重複行程。
      await batch.commit();

      const newItems = docRefs.map((ref, idx) => ({
        ...eventData,
        id: ref.id,
        date: uniqueDates[idx]
      })) as DateItem[];

      setDates(prev => {
        const newIds = new Set(newItems.map(item => item.id));
        const newState = [...prev.filter(item => !newIds.has(item.id)), ...newItems].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        updateCache(newState);
        return newState;
      });

      toast.success(`已新增 ${uniqueDates.length} 個行程 🎉`);
      return true;
    } catch (error) {
      console.error("Error batch adding: ", error);
      toast.error("批次新增失敗");
      return false;
    }
  };

  return {
    dates,
    addDate,
    deleteDate,
    deleteDates,
    updateDate,
    duplicateDate,
    addDateToMultipleDates,
    isLoaded,
    refresh,
    isRefreshing
  };
}
