'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCalculator from '@/components/RecipeManager/RecipeCalculator';
import AddRecipeModal from '@/components/RecipeManager/AddRecipeModal';
import { ChefHat, Plus, Search } from 'lucide-react';
import { Recipe } from '@/types';

export default function RecipesPage() {
  // 1. 引入 updateRecipe
  const { recipes, addRecipe, updateRecipe, deleteRecipe, isLoaded } = useRecipes();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null); // 用於計算機
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 2. 新增狀態：記錄正在編輯的食譜 (如果為 null 代表是新增模式)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Filter Logic
  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. 統一處理表單送出 (新增或修改)
  const handleModalSubmit = (recipeData: Recipe) => {
    if (editingRecipe) {
      // ✏️ 如果有 editingRecipe，代表是更新
      // updateRecipe 只需要 id 和要改的欄位，這裡我們把整個新資料傳進去
      // 注意：recipeData 裡面已經有 ID 了 (由 Modal 處理)
      const { id, ...fieldsToUpdate } = recipeData;
      updateRecipe(editingRecipe.id, fieldsToUpdate);
    } else {
      // ➕ 否則就是新增
      addRecipe(recipeData);
    }
    setIsAddModalOpen(false);
    setEditingRecipe(null); // 清除編輯狀態
  };

  // 開啟新增模式
  const openAddModal = () => {
    setEditingRecipe(null);
    setIsAddModalOpen(true);
  };

  // 開啟編輯模式 (從計算機傳過來)
  const openEditModal = (recipe: Recipe) => {
    setSelectedRecipe(null); // 關閉計算機
    setEditingRecipe(recipe); // 設定要編輯的食譜
    setIsAddModalOpen(true); // 開啟 Modal
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-500">載入中...</div>;

  return (
    <div className="container min-h-screen pb-32 pt-28"> {/* pt-28 避開 Navbar */}
      <header className="mb-8 px-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400 drop-shadow-sm mb-4">
          食譜轉換神器
        </h1>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
             className="w-full pl-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 transition-all hover:bg-white/10"
             placeholder="搜尋食譜..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
         {filteredRecipes.length > 0 ? (
           filteredRecipes.map(recipe => (
             <button
               key={recipe.id}
               onClick={() => setSelectedRecipe(recipe)}
               className="glass-card p-6 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group flex flex-col h-full border border-white/5 hover:border-orange-500/30 bg-[#161b2c]"
             >
                <div className="flex items-start justify-between mb-3">
                   <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ChefHat size={24} />
                   </div>
                   <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {recipe.baseServings} 人份
                   </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                    {recipe.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1 border-l-2 border-slate-700 pl-3">
                  {recipe.description || '無詳細說明'}
                </p>
                <div className="text-xs text-slate-500 border-t border-white/5 pt-3 flex items-center justify-between">
                   <span>{recipe.ingredients.length} 項食材</span>
                   <span className="text-orange-500/50 group-hover:text-orange-500 text-[10px] uppercase tracking-wider font-bold">Tap to Cook</span>
                </div>
             </button>
           ))
         ) : (
           <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
              <ChefHat size={48} className="mb-4 opacity-20" />
              <p>{searchTerm ? '找不到相關食譜' : '還沒有食譜喔，按右下角新增！'}</p>
           </div>
         )}
      </main>

      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 z-40 transition-all hover:scale-110 active:scale-95"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Calculator Modal */}
      {selectedRecipe && (
        <RecipeCalculator 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          onDelete={(id) => {
             deleteRecipe(id);
             setSelectedRecipe(null);
          }}
          onAdd={addRecipe}
          // 👇 傳入編輯函式
          onEdit={() => openEditModal(selectedRecipe)}
        />
      )}

      {/* Add/Edit Modal */}
      <AddRecipeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        // 👇 這裡改用 onSubmit 來統一處理
        onSubmit={handleModalSubmit}
        // 👇 把正在編輯的資料傳進去 (如果是新增則是 null)
        initialData={editingRecipe}
      />
    </div>
  );
}