// src/hooks/useDates.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // 👈 新增這個
import { db, auth } from '@/lib/firebase';         // 👈 記得引入 auth
import { DateItem } from '@/types';

export function useDates() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // 1. 監聽「登入狀態」改變
    // 這是最重要的一步！Firebase 會自動告訴我們現在使用者登入沒
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      
      // 先取消上一次的監聽 (避免重複訂閱)
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // ✅ 狀況 A：使用者已登入 -> 開始抓資料
        const q = query(collection(db, "schedules"), orderBy("date", "asc"));
        
        unsubscribeSnapshot = onSnapshot(q, 
          (snapshot) => {
            const datesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as DateItem[];
            
            setDates(datesData);
            setIsLoaded(true); // 載入完成！
          },
          (error) => {
            console.error("資料讀取失敗:", error);
            setIsLoaded(true); // 就算失敗也要讓畫面出來
          }
        );
      } else {
        // ❌ 狀況 B：使用者沒登入 -> 清空資料，但顯示畫面
        setDates([]);
        setIsLoaded(true); // 讓 Loading 消失，這樣才看得到登入按鈕！
      }
    });

    // 元件卸載時的清理工作
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const addDate = async (newItem: DateItem) => {
    if (!auth.currentUser) {
      alert("請先登入才能新增行程喔！");
      return;
    }
    try {
      const { id, ...dataToSave } = newItem;
      await addDoc(collection(db, "schedules"), {
        ...dataToSave,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("新增失敗，可能權限不足");
    }
  };

  const deleteDate = async (id: string) => {
    if (!auth.currentUser) return;
    if (!confirm("確定要刪除這個行程嗎？")) return;
    
    try {
      await deleteDoc(doc(db, "schedules", id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  return { dates, addDate, deleteDate, isLoaded };
}