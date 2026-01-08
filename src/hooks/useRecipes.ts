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
import toast from 'react-hot-toast'; 

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🛠️ 輔助函式：產生食譜的快取 Key
  const getCacheKey = (uid: string) => `recipe_cache_${uid}`;

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

      // ✨✨✨ 關鍵 1: 抓到新資料後，馬上存入 LocalStorage ✨✨✨
      localStorage.setItem(getCacheKey(user.uid), JSON.stringify(recipesData));

    } catch (error) {
      console.error("讀取食譜失敗:", error);
      toast.error("連線不穩，目前顯示的是舊資料");
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [isLoaded]);

  // 2. 監聽登入狀態 & 初始載入
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ✨✨✨ 關鍵 2: 一登入，先從 LocalStorage 拿舊資料顯示 ✨✨✨
        const cached = localStorage.getItem(getCacheKey(user.uid));
        if (cached) {
          try {
            setRecipes(JSON.parse(cached));
            setIsLoaded(true); // 有快取就算載入完成，不用等
          } catch (e) {
            console.error("快取解析失敗", e);
          }
        }
        // 背景去抓最新的
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

  // 🛠️ 輔助函式：同步更新快取 (避免程式碼重複)
  const updateCache = (newRecipes: Recipe[]) => {
    if (auth.currentUser) {
      localStorage.setItem(getCacheKey(auth.currentUser.uid), JSON.stringify(newRecipes));
    }
  };

  // 4. 新增食譜
  const addRecipe = async (newItem: Recipe) => {
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
      
      const savedItem = { ...newItem, id: docRef.id };
      
      setRecipes(prev => {
        const newState = [savedItem, ...prev];
        updateCache(newState); // ✨ 同步快取
        return newState;
      });
      
      toast.success("食譜新增成功！🎉");
      
    } catch (error) {
      console.error("Error adding recipe: ", error);
      toast.error("新增失敗，請稍後再試");
    }
  };

  // 5. 刪除食譜
  const deleteRecipe = async (id: string) => {
    if (!auth.currentUser) {
       toast.error("請先登入才能操作喔 🚫");
       return;
    }
    if (!confirm("確定要刪除這個食譜嗎？")) return;
    
    try {
      await deleteDoc(doc(db, "recipes", id));
      
      setRecipes(prev => {
        const newState = prev.filter(item => item.id !== id);
        updateCache(newState); // ✨ 同步快取
        return newState;
      });
      
      toast.success("食譜已刪除 👋");
      
    } catch (error) {
      console.error("Error deleting recipe: ", error);
      toast.error("刪除失敗");
    }
  };

  // 6. 更新食譜
  const updateRecipe = async (id: string, updatedFields: Partial<Recipe>) => {
    if (!auth.currentUser) {
       toast.error("請先登入才能修改食譜 🚫");
       return;
    }

    try {
      const recipeRef = doc(db, "recipes", id);
      await updateDoc(recipeRef, updatedFields);
      
      setRecipes(prev => {
        const newState = prev.map(item => 
          item.id === id ? { ...item, ...updatedFields } : item
        );
        updateCache(newState); // ✨ 同步快取
        return newState;
      });
      
      toast.success("食譜更新完成 ✨");
      
    } catch (error) {
      console.error("Error updating recipe: ", error);
      toast.error("更新失敗");
    }
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe, isLoaded, refresh, isRefreshing };
}