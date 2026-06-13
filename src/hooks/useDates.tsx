// src/hooks/useDates.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { DateItem } from '@/types';
import toast from 'react-hot-toast';

export function useDates() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 用 ref 追蹤載入狀態，避免把 isLoaded 列入 useCallback 依賴
  // 若把 isLoaded 列入依賴，每次 isLoaded 改變都會重建 fetchDates，
  // 進而觸發下方 useEffect 重跑，造成初次載入後多 fetch 一次 Firebase
  const isLoadedRef = useRef(false);

  // 🛠️ 輔助函式：產生快取 Key (每個使用者要有獨立的 Key，避免跟別人混到)
  // 加入版本號，未來資料結構升版時可安全清除舊快取
  const getCacheKey = (uid: string) => `schedule_cache_v2_${uid}`;

  // 1. 定義抓取函式（空依賴：callback 永遠穩定，不會意外觸發 useEffect）
  const fetchDates = useCallback(async (user: { uid: string }) => {
    // 只有手動重新整理時（已載入完成），才顯示轉圈圈
    if (isLoadedRef.current) setIsRefreshing(true);
    
    try {
      const q = query(collection(db, "schedules"), orderBy("date", "asc"));
      const snapshot = await getDocs(q);
      
      const datesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // 🔄 相容性處理：
        // 舊資料只有 time 欄位，新資料使用 startTime
        // 如果沒有 startTime 但有 time，就拿 time 來當作 startTime 顯示
        const finalStartTime = data.startTime || data.time;
        
        return {
          id: doc.id,
          ...data,
          startTime: finalStartTime,
        };
      }) as DateItem[];
      
      setDates(datesData);

      // 抓到新資料後，馬上存入 LocalStorage 供下次快速載入
      localStorage.setItem(getCacheKey(user.uid), JSON.stringify(datesData));

    } catch (error) {
      console.error("讀取失敗:", error);
      toast.error("連線不穩，目前顯示的是舊資料");
    } finally {
      isLoadedRef.current = true;
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, []); // 空依賴：getCacheKey 是 pure function，不需要列入

  // 2. 初始載入邏輯
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ✨✨✨ 關鍵 2: 一登入，先從 LocalStorage 拿舊資料顯示 ✨✨✨
        const cached = localStorage.getItem(getCacheKey(user.uid));
        if (cached) {
          try {
            setDates(JSON.parse(cached));
            setIsLoaded(true); // 有快取就算載入完成，使用者不用等
          } catch (e) {
            console.error("快取解析失敗", e);
          }
        }

        // 然後在背景偷偷去抓最新的 (背景更新)
        fetchDates(user);
      } else {
        setDates([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchDates]);

  // refresh 保持不變
  const refresh = () => {
    if (auth.currentUser) {
      fetchDates(auth.currentUser);
    }
  };

  // 3. 新增/刪除/修改時，也要同步更新快取，不然重整後會閃爍
  const updateCache = (newDates: DateItem[]) => {
    if (auth.currentUser) {
      localStorage.setItem(getCacheKey(auth.currentUser.uid), JSON.stringify(newDates));
    }
  };

  const addDate = async (newItem: DateItem) => {
    if (!auth.currentUser) {
      toast.error("請先登入");
      return;
    }
    try {
      const { id, ...dataToSave } = newItem;
      const docRef = await addDoc(collection(db, "schedules"), {
        ...dataToSave,
        createdAt: new Date()
      });

      const savedItem = { ...newItem, id: docRef.id };
      
      setDates(prev => {
        const newState = [...prev, savedItem].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        // ✨ 同步寫入快取
        updateCache(newState);
        return newState;
      });
      
      toast.success("新增成功！🎉");
    } catch (error) {
      console.error("Error adding: ", error);
      toast.error("新增失敗");
    }
  };

  const deleteDate = async (id: string) => {
    if (!auth.currentUser) return;
    
    // 找到要刪除的項目，準備給 undo 用
    const itemToDelete = dates.find(item => item.id === id);
    if (!itemToDelete) return;
    
    // 保存原始狀態
    const previousDates = [...dates];
    
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
                const { id: _, ...dataToRestore } = itemToDelete;
                const docRef = await addDoc(collection(db, "schedules"), {
                  ...dataToRestore,
                  createdAt: new Date()
                });
                
                // 更新本地狀態
                setDates(prev => {
                  const restored = { ...itemToDelete, id: docRef.id };
                  const newState = [...prev, restored].sort((a, b) => 
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
      setDates(previousDates);
      updateCache(previousDates);
    }
  };

  const updateDate = async (id: string, updatedData: Partial<DateItem>) => {
    if (!auth.currentUser) return;
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
    } catch (error) {
      console.error("Error updating: ", error);
      toast.error("更新失敗");
    }
  };

  // 批次刪除
  const deleteDates = async (ids: string[]) => {
    if (!auth.currentUser) return;
    if (ids.length === 0) return;

    // 找到要刪除的項目
    const itemsToDelete = dates.filter(item => ids.includes(item.id));
    if (itemsToDelete.length === 0) return;

    // 保存原始狀態
    const previousDates = [...dates];

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
      setDates(previousDates);
      updateCache(previousDates);
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
      const { id, ...dataToCopy } = sourceEvent;
      const docRef = await addDoc(collection(db, "schedules"), {
        ...dataToCopy,
        date: targetDateString, // 只改變日期
        createdAt: new Date()
      });
      
      const duplicatedItem = { ...dataToCopy, id: docRef.id, date: targetDateString } as DateItem;
      
      setDates(prev => {
        const newState = [...prev, duplicatedItem].sort((a, b) => 
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
      return;
    }
    
    if (dateStrings.length === 0) {
      toast.error("請先選擇日期");
      return;
    }
    
    try {
      const promises = dateStrings.map(dateString => 
        addDoc(collection(db, "schedules"), {
          ...eventData,
          date: dateString,
          createdAt: new Date()
        })
      );
      
      const docRefs = await Promise.all(promises);
      
      const newItems = docRefs.map((ref, idx) => ({
        ...eventData,
        id: ref.id,
        date: dateStrings[idx]
      })) as DateItem[];
      
      setDates(prev => {
        const newState = [...prev, ...newItems].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        updateCache(newState);
        return newState;
      });
      
      toast.success(`已新增 ${dateStrings.length} 個行程 🎉`);
    } catch (error) {
      console.error("Error batch adding: ", error);
      toast.error("批次新增失敗");
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