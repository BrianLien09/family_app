import { useSharedCollection } from '@/hooks/useSharedCollection';
// src/hooks/useExpenses.tsx
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { omitId } from '@/lib/object';
import { ExpenseItem } from '@/types';
import toast from 'react-hot-toast';

const collectionOptions = {
  collectionName: 'expenses',
  cachePrefix: 'expense_cache_v1_',
  orderField: 'date',
  orderDirection: 'desc' as const,
  deserialize: (id: string, data: Record<string, unknown>): ExpenseItem => ({ ...data, id } as unknown as ExpenseItem),
};

export function useExpenses() {
  const { data: expenses, setData: setExpenses, isLoaded, isRefreshing, refresh, updateCache, restoreData } = useSharedCollection<ExpenseItem>(collectionOptions);

  const addExpense = async (newItem: Omit<ExpenseItem, 'id'>) => {
    if (!auth.currentUser) {
      toast.error('請先登入才能新增記錄');
      return false;
    }

    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...newItem,
        createdAt: new Date(),
      });

      const savedItem: ExpenseItem = { ...newItem, id: docRef.id };

      setExpenses(prev => {
        // 依日期降冪排列
        const newState = [savedItem, ...prev.filter(item => item.id !== savedItem.id)].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        updateCache(newState);
        return newState;
      });

      toast.success('記錄新增成功！💰');
      return true;
    } catch (error) {
      console.error('新增失敗:', error);
      toast.error('新增失敗，請稍後再試');
      return false;
    }
  };

  // 刪除記錄（含復原）
  const deleteExpense = async (id: string) => {
    if (!auth.currentUser) return;

    const itemToDelete = expenses.find(item => item.id === id);
    if (!itemToDelete) return;


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
                  const dataToRestore = omitId(itemToDelete);
                  const docRef = await addDoc(collection(db, 'expenses'), {
                    ...dataToRestore,
                    createdAt: new Date(),
                  });
                  setExpenses(prev => {
                    const restored: ExpenseItem = { ...itemToDelete, id: docRef.id };
                    const newState = [restored, ...prev.filter(item => item.id !== restored.id)].sort(
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
              className="px-3 py-1 bg-[#5f7186] hover:bg-[#47576b] text-[#f0ece1] text-sm font-semibold rounded-md transition-all duration-200"
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
      restoreData();
    }
  };

  // 更新記錄
  const updateExpense = async (id: string, updatedFields: Partial<ExpenseItem>) => {
    if (!auth.currentUser) {
      toast.error('請先登入才能修改記錄');
      return false;
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
      return true;
    } catch (error) {
      console.error('更新失敗:', error);
      toast.error('更新失敗');
      return false;
    }
  };

  // 批次刪除
  const deleteExpenses = async (ids: string[]) => {
    if (!auth.currentUser || ids.length === 0) return;


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
      restoreData();
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
