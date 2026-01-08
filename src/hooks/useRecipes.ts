// src/hooks/useRecipes.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Recipe } from '@/types'; 
import toast from 'react-hot-toast'; // ✨ 確保有引入 toast

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. 讀取食譜
  const fetchRecipes = useCallback(async (user: any) => {
    if (isLoaded) setIsRefreshing(true);
    try {
      const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const recipesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      setRecipes(recipesData);
    } catch (error) {
      console.error("讀取食譜失敗:", error);
      toast.error("無法讀取食譜 😓");
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [isLoaded]);

  // 2. 監聽登入狀態
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecipes(user);
      } else {
        setRecipes([]);
        setIsLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchRecipes]);

  // 3. 手動重新整理
  const refresh = () => {
    if (auth.currentUser) {
      fetchRecipes(auth.currentUser);
    } else {
      toast("請先登入才能查看食譜喔 👀", { icon: '🔒' });
    }
  };

  // ✨✨✨ 4. 新增食譜 (加入登入檢查與提示) ✨✨✨
  const addRecipe = async (newItem: Recipe) => {
    // 🛑 登入檢查
    if (!auth.currentUser) {
      toast.error("請先登入才能新增食譜喔！👨‍🍳");
      return;
    }
    
    try {
      const { id, ...dataToSave } = newItem;
      const docRef = await addDoc(collection(db, "recipes"), {
        ...dataToSave,
        createdAt: new Date()
      });
      
      // 手動更新前端 State
      const savedItem = { ...newItem, id: docRef.id };
      setRecipes(prev => [savedItem, ...prev]);
      
      toast.success("食譜新增成功！🎉"); // ✅ 成功提示
      
    } catch (error) {
      console.error("Error adding recipe: ", error);
      toast.error("新增失敗，請稍後再試");
    }
  };

  // ✨✨✨ 5. 刪除食譜 ✨✨✨
  const deleteRecipe = async (id: string) => {
    // 🛑 登入檢查
    if (!auth.currentUser) {
       toast.error("請先登入才能操作喔 🚫");
       return;
    }

    if (!confirm("確定要刪除這個食譜嗎？")) return;
    
    try {
      await deleteDoc(doc(db, "recipes", id));
      setRecipes(prev => prev.filter(item => item.id !== id));
      
      toast.success("食譜已刪除 👋"); // ✅ 成功提示
      
    } catch (error) {
      console.error("Error deleting recipe: ", error);
      toast.error("刪除失敗");
    }
  };

  // ✨✨✨ 6. 更新食譜 ✨✨✨
  const updateRecipe = async (id: string, updatedFields: Partial<Recipe>) => {
    // 🛑 登入檢查
    if (!auth.currentUser) {
       toast.error("請先登入才能修改食譜 🚫");
       return;
    }

    try {
      const recipeRef = doc(db, "recipes", id);
      await updateDoc(recipeRef, updatedFields);
      
      setRecipes(prev => prev.map(item => 
        item.id === id ? { ...item, ...updatedFields } : item
      ));
      
      toast.success("食譜更新完成 ✨"); // ✅ 成功提示
      
    } catch (error) {
      console.error("Error updating recipe: ", error);
      toast.error("更新失敗");
    }
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe, isLoaded, refresh, isRefreshing };
}