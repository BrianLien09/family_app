// src/hooks/useDates.ts
import { useState, useEffect, useCallback } from 'react';
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

  // 🛠️ 輔助函式：產生快取 Key (每個使用者要有獨立的 Key，避免跟別人混到)
  const getCacheKey = (uid: string) => `schedule_cache_${uid}`;

  // 1. 定義抓取函式
  const fetchDates = useCallback(async (user: any) => {
    // 只有手動重新整理時，才顯示 Loading 轉圈圈 (因為初始載入我們有快取了)
    if (isLoaded) setIsRefreshing(true);
    
    try {
      const q = query(collection(db, "schedules"), orderBy("date", "asc"));
      const snapshot = await getDocs(q);
      
      const datesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DateItem[];
      
      setDates(datesData);

      // ✨✨✨ 關鍵 1: 抓到新資料後，馬上存入 LocalStorage ✨✨✨
      localStorage.setItem(getCacheKey(user.uid), JSON.stringify(datesData));

    } catch (error) {
      console.error("讀取失敗:", error);
      toast.error("連線不穩，目前顯示的是舊資料");
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [isLoaded]);

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
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-md transition-colors"
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

  return { dates, addDate, deleteDate, updateDate, isLoaded, refresh, isRefreshing };
}