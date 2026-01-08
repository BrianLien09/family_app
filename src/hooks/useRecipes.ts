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
import { Recipe } from '@/types'; // 請確認你的型別路徑

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // ✨ 新增
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } finally {
      setIsLoaded(true);
      setIsRefreshing(false);
    }
  }, [isLoaded]);

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

  // ✨ 新增 refresh
  const refresh = () => {
    if (auth.currentUser) {
      fetchRecipes(auth.currentUser);
    }
  };

  const addRecipe = async (newItem: Recipe) => {
    if (!auth.currentUser) return;
    try {
      const { id, ...dataToSave } = newItem;
      const docRef = await addDoc(collection(db, "recipes"), {
        ...dataToSave,
        createdAt: new Date()
      });
      const savedItem = { ...newItem, id: docRef.id };
      setRecipes(prev => [savedItem, ...prev]);
    } catch (error) {
      console.error("Error adding recipe: ", error);
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!auth.currentUser) return;
    if (!confirm("確定要刪除這個食譜嗎？")) return;
    try {
      await deleteDoc(doc(db, "recipes", id));
      setRecipes(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting recipe: ", error);
    }
  };

  const updateRecipe = async (id: string, updatedFields: Partial<Recipe>) => {
    if (!auth.currentUser) return;
    try {
      const recipeRef = doc(db, "recipes", id);
      await updateDoc(recipeRef, updatedFields);
      setRecipes(prev => prev.map(item => 
        item.id === id ? { ...item, ...updatedFields } : item
      ));
    } catch (error) {
      console.error("Error updating recipe: ", error);
    }
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe, isLoaded, refresh, isRefreshing };
}