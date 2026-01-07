'use client';

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
import { onAuthStateChanged } from 'firebase/auth'; // 👈 引入監聽器
import { db, auth } from '@/lib/firebase';         // 👈 記得引入 auth
import { Recipe } from '@/types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // 1. 監聽登入狀態
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      
      // 清理上一次的 snapshot 監聽
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // ✅ 使用者已登入 -> 開始抓取資料
        // 這裡我們先不排序，或者你可以加 orderBy("title")
        const q = query(collection(db, "recipes")); 

        unsubscribeSnapshot = onSnapshot(q, 
          (snapshot) => {
            const recipeData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Recipe[];
            
            setRecipes(recipeData);
            setIsLoaded(true); // 載入完成
          },
          (error) => {
            console.error("食譜讀取失敗:", error);
            setIsLoaded(true); // 發生錯誤也要讓 Loading 消失
          }
        );
      } else {
        // ❌ 使用者未登入 -> 清空資料
        setRecipes([]);
        setIsLoaded(true);
      }
    });

    // 元件卸載時清理
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // 2. 新增食譜
  const addRecipe = async (recipe: Recipe) => {
    if (!auth.currentUser) {
      alert("請先登入才能新增食譜喔！");
      return;
    }

    try {
      const { id, ...dataToSave } = recipe;
      
      await addDoc(collection(db, "recipes"), {
        ...dataToSave,
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error("Error adding recipe: ", error);
      alert("新增失敗，請檢查權限或網路");
    }
  };

  // 3. 刪除食譜
  const deleteRecipe = async (id: string) => {
    if (!auth.currentUser) return;
    if (!confirm("確定要刪除這道私房食譜嗎？")) return;
    
    try {
      await deleteDoc(doc(db, "recipes", id));
    } catch (error) {
      console.error("Error deleting recipe: ", error);
      alert("刪除失敗，請稍後再試");
    }
  };

  return { recipes, addRecipe, deleteRecipe, isLoaded };
}