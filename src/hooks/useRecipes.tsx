import { useSharedCollection } from '@/hooks/useSharedCollection';
// src/hooks/useRecipes.ts
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { omitId } from '@/lib/object';
import { Recipe } from '@/types'; 
import toast from 'react-hot-toast'; 

const collectionOptions = {
  collectionName: 'recipes',
  cachePrefix: 'recipe_cache_',
  orderField: 'createdAt',
  orderDirection: 'desc' as const,
  deserialize: (id: string, data: Record<string, unknown>): Recipe => ({ ...data, id } as unknown as Recipe),
};

export function useRecipes() {
  const { data: recipes, setData: setRecipes, isLoaded, isRefreshing, refresh, updateCache, restoreData } = useSharedCollection<Recipe>(collectionOptions);

  const addRecipe = async (newItem: Recipe) => {
    if (!auth.currentUser) {
      toast.error("請先登入才能新增食譜喔！👨‍🍳");
      return false;
    }
    
    try {
      const dataToSave = omitId(newItem);
      const docRef = await addDoc(collection(db, "recipes"), {
        ...dataToSave,
        createdAt: new Date()
      });
      
      const savedItem = { ...newItem, id: docRef.id };
      
      setRecipes(prev => {
        const newState = [savedItem, ...prev.filter(item => item.id !== savedItem.id)];
        updateCache(newState); // ✨ 同步快取
        return newState;
      });
      
      toast.success("食譜新增成功！🎉");
      
      return true;
    } catch (error) {
      console.error("Error adding recipe: ", error);
      toast.error("新增失敗，請稍後再試");
      return false;
    }
  };

  // 5. 刪除食譜 (含復原功能)
  const deleteRecipe = async (id: string) => {
    if (!auth.currentUser) {
       toast.error("請先登入才能操作喔 🚫");
       return;
    }
    
    // 找到要刪除的食譜
    const itemToDelete = recipes.find(item => item.id === id);
    if (!itemToDelete) return;
    
    
    // 樂觀更新：先從 UI 移除
    setRecipes(prev => {
      const newState = prev.filter(item => item.id !== id);
      updateCache(newState);
      return newState;
    });
    
    try {
      // 實際刪除 Firebase 資料
      await deleteDoc(doc(db, "recipes", id));
      
      // 顯示成功訊息與復原按鈕
      toast((t) => (
        <div className="flex items-center gap-3">
          <span>食譜已刪除 👋</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              // 復原：重新新增回 Firebase
              try {
                const dataToRestore = omitId(itemToDelete);
                const docRef = await addDoc(collection(db, "recipes"), {
                  ...dataToRestore,
                  createdAt: new Date()
                });
                
                // 更新本地狀態
                setRecipes(prev => {
                  const restored = { ...itemToDelete, id: docRef.id };
                  const newState = [restored, ...prev.filter(item => item.id !== restored.id)];
                  updateCache(newState);
                  return newState;
                });
                
                toast.success("已復原食譜 ✨");
              } catch (error) {
                console.error("Undo failed:", error);
                toast.error("復原失敗");
              }
            }}
            className="px-3 py-1 bg-[#b87e6b] hover:bg-[#b87e6b] text-[#f0ece1] text-sm font-semibold rounded-md transition-all duration-200"
          >
            復原
          </button>
        </div>
      ), {
        duration: 5000,
        id: `delete-recipe-${id}`,
      });
      
    } catch (error) {
      console.error("Error deleting recipe: ", error);
      toast.error("刪除失敗");
      // 刪除失敗，回復狀態
      restoreData();
    }
  };

  // 6. 更新食譜
  const updateRecipe = async (id: string, updatedFields: Partial<Recipe>) => {
    if (!auth.currentUser) {
       toast.error("請先登入才能修改食譜 🚫");
       return false;
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
      
      return true;
    } catch (error) {
      console.error("Error updating recipe: ", error);
      toast.error("更新失敗");
      return false;
    }
  };

  // 7. 批次刪除食譜
  const deleteRecipes = async (ids: string[]) => {
    if (!auth.currentUser) return;
    if (ids.length === 0) return;

    // 找到要刪除的項目
    const itemsToDelete = recipes.filter(item => ids.includes(item.id));
    if (itemsToDelete.length === 0) return;


    // 樂觀更新：先從 UI 移除
    setRecipes(prev => {
      const newState = prev.filter(item => !ids.includes(item.id));
      updateCache(newState);
      return newState;
    });

    try {
      // 批次刪除 Firebase 資料
      await Promise.all(ids.map(id => deleteDoc(doc(db, "recipes", id))));

      // 顯示成功訊息
      toast.success(`已刪除 ${ids.length} 個食譜 👋`);

    } catch (error) {
      console.error("Error batch deleting recipes: ", error);
      toast.error("批次刪除失敗");
      // 刪除失敗，回復狀態
      restoreData();
    }
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe, deleteRecipes, isLoaded, refresh, isRefreshing };
}
