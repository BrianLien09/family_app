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
  // ✨ 新增：重新整理的狀態
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 定義抓取函式
  const fetchDates = useCallback(async (user: any) => {
    // 如果是手動觸發，才顯示 loading 轉圈圈
    if (isLoaded) setIsRefreshing(true);
    
    try {
      const q = query(collection(db, "schedules"), orderBy("date", "asc"));
      const snapshot = await getDocs(q);
      
      const datesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DateItem[];
      
      setDates(datesData);
    } catch (error) {
      console.error("讀取失敗:", error);
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [isLoaded]);

  // 初始載入
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDates(user);
      } else {
        setDates([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchDates]);

  // ✨ 新增：給外部呼叫的 refresh
  const refresh = () => {
    if (auth.currentUser) {
      fetchDates(auth.currentUser);
    }
  };

  const addDate = async (newItem: DateItem) => {
    if (!auth.currentUser) {
      toast.error("請先登入才能新增喔！");
      return;
    }
    try {
      const { id, ...dataToSave } = newItem;
      const docRef = await addDoc(collection(db, "schedules"), {
        ...dataToSave,
        createdAt: new Date()
      });
      const savedItem = { ...newItem, id: docRef.id };
      setDates(prev => [...prev, savedItem].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (error) {
      console.error("Error adding: ", error);
      alert("新增失敗");
    }
  };

  const deleteDate = async (id: string) => {
    if (!auth.currentUser) return;
    if (!confirm("確定要刪除這個行程嗎？")) return;
    try {
      await deleteDoc(doc(db, "schedules", id));
      setDates(prev => prev.filter(item => item.id !== id));
      toast.success("行程已刪除 👋");
    } catch (error) {
      console.error("Error deleting: ", error);
      toast.error("刪除失敗");
    }
  };

  const updateDate = async (id: string, updatedData: Partial<DateItem>) => {
    if (!auth.currentUser) return;
    try {
      const dateRef = doc(db, "schedules", id);
      await updateDoc(dateRef, { ...updatedData });
      setDates(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
      toast.success("行程已更新 ✨");
    } catch (error) {
      console.error("Error updating: ", error);
      toast.error("更新失敗");
    }
  };

  return { dates, addDate, deleteDate, updateDate, isLoaded, refresh, isRefreshing };
}