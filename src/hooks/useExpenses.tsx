// src/hooks/useExpenses.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { ExpenseItem } from '@/types';
import toast from 'react-hot-toast';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 用 ref 追蹤載入狀態，避免把 isLoaded 列入 useCallback 依賴
  const isLoadedRef = useRef(false);

  // 每個使用者獨立的快取 Key（版本號方便未來升版清除）
  const getCacheKey = (uid: string) => `expense_cache_v1_${uid}`;

  const fetchExpenses = useCallback(async (user: { uid: string }) => {
    // 只有手動重新整理時才顯示轉圈圈
    if (isLoadedRef.current) setIsRefreshing(true);

    try {
      const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as ExpenseItem[];

      setExpenses(data);
      localStorage.setItem(getCacheKey(user.uid), JSON.stringify(data));
    } catch (error) {
      console.error('讀取帳本失敗:', error);
      toast.error('連線不穩，目前顯示的是舊資料');
    } finally {
      isLoadedRef.current = true;
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  // 監聽登入狀態，登入後先顯示快取再背景更新
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const cached = localStorage.getItem(getCacheKey(user.uid));
        if (cached) {
          try {
            setExpenses(JSON.parse(cached));
            setIsLoaded(true);
          } catch (e) {
            console.error('快取解析失敗', e);
          }
        }
        fetchExpenses(user);
      } else {
        setExpenses([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchExpenses]);

  const refresh = () => {
    if (auth.currentUser) fetchExpenses(auth.currentUser);
  };

  // 同步快取的輔助函式
  const updateCache = (newExpenses: ExpenseItem[]) => {
    if (auth.currentUser) {
      localStorage.setItem(getCacheKey(auth.currentUser.uid), JSON.stringify(newExpenses));
    }
  };

  // 新增記錄
  const addExpense = async (newItem: Omit<ExpenseItem, 'id'>) => {
    if (!auth.currentUser) {
      toast.error('請先登入才能新增記錄');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...newItem,
        createdAt: new Date(),
      });

      const savedItem: ExpenseItem = { ...newItem, id: docRef.id };

      setExpenses(prev => {
        // 依日期降冪排列
        const newState = [savedItem, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        updateCache(newState);
        return newState;
      });

      toast.success('記錄新增成功！💰');
    } catch (error) {
      console.error('新增失敗:', error);
      toast.error('新增失敗，請稍後再試');
    }
  };

  // 刪除記錄（含復原）
  const deleteExpense = async (id: string) => {
    if (!auth.currentUser) return;

    const itemToDelete = expenses.find(item => item.id === id);
    if (!itemToDelete) return;

    const previousExpenses = [...expenses];

    // 樂觀更新
    setExpenses(prev => {
      const newState = prev.filter(item => item.id !== id);
      updateCache(newState);
      return newState;
    });

    try {
      await deleteDoc(doc(db, 'expenses', id));

      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span>記錄已刪除 👋</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const { id: _, ...dataToRestore } = itemToDelete;
                  const docRef = await addDoc(collection(db, 'expenses'), {
                    ...dataToRestore,
                    createdAt: new Date(),
                  });
                  setExpenses(prev => {
                    const restored: ExpenseItem = { ...itemToDelete, id: docRef.id };
                    const newState = [restored, ...prev].sort(
                      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    updateCache(newState);
                    return newState;
                  });
                  toast.success('已復原記錄 ✨');
                } catch (error) {
                  console.error('復原失敗:', error);
                  toast.error('復原失敗');
                }
              }}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-md transition-colors"
            >
              復原
            </button>
          </div>
        ),
        { duration: 5000, id: `delete-expense-${id}` }
      );
    } catch (error) {
      console.error('刪除失敗:', error);
      toast.error('刪除失敗');
      setExpenses(previousExpenses);
      updateCache(previousExpenses);
    }
  };

  // 更新記錄
  const updateExpense = async (id: string, updatedFields: Partial<ExpenseItem>) => {
    if (!auth.currentUser) {
      toast.error('請先登入才能修改記錄');
      return;
    }

    try {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, updatedFields);

      setExpenses(prev => {
        const newState = prev.map(item =>
          item.id === id ? { ...item, ...updatedFields } : item
        );
        // 如果有改日期，可能需要重新排序
        newState.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        updateCache(newState);
        return newState;
      });

      toast.success('記錄更新完成 ✨');
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('更新失敗');
    }
  };

  // 批次刪除
  const deleteExpenses = async (ids: string[]) => {
    if (!auth.currentUser || ids.length === 0) return;

    const previousExpenses = [...expenses];

    setExpenses(prev => {
      const newState = prev.filter(item => !ids.includes(item.id));
      updateCache(newState);
      return newState;
    });

    try {
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'expenses', id))));
      toast.success(`已刪除 ${ids.length} 筆記錄 👋`);
    } catch (error) {
      console.error('批次刪除失敗:', error);
      toast.error('批次刪除失敗');
      setExpenses(previousExpenses);
      updateCache(previousExpenses);
    }
  };

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpenses,
    isLoaded,
    isRefreshing,
    refresh,
  };
}
