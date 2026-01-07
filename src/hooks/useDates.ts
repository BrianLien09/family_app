// src/hooks/useDates.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, // 👈 1. 新增引入這個
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { DateItem } from '@/types';

export function useDates() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // 使用 "schedules" 集合
        const q = query(collection(db, "schedules"), orderBy("date", "asc"));
        
        unsubscribeSnapshot = onSnapshot(q, 
          (snapshot) => {
            const datesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as DateItem[];
            
            setDates(datesData);
            setIsLoaded(true);
          },
          (error) => {
            console.error("資料讀取失敗:", error);
            setIsLoaded(true);
          }
        );
      } else {
        setDates([]);
        setIsLoaded(true);
      }
    });

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

  // 👇 2. 新增這個更新函式
  const updateDate = async (id: string, updatedData: Partial<DateItem>) => {
    if (!auth.currentUser) return;
    try {
      const dateRef = doc(db, "schedules", id);
      await updateDoc(dateRef, {
        ...updatedData,
        // updatedAt: new Date() // 如果你想紀錄更新時間可以加這行
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("更新失敗");
    }
  };

  // 👈 3. 記得把它匯出
  return { dates, addDate, deleteDate, updateDate, isLoaded };
}