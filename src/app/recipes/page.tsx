'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCalculator from '@/components/RecipeManager/RecipeCalculator';
import AddRecipeModal from '@/components/RecipeManager/AddRecipeModal';
import { ChefHat, Plus, Search } from 'lucide-react';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const { recipes, addRecipe, deleteRecipe, isLoaded } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter
  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) return <div className="p-8 text-center text-slate-500">載入中...</div>;

  return (
    <div className="container min-h-screen pb-32 pt-8">
      <header className="mb-8 px-2">
        <h1 className="heading-1 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400">
          食譜轉換神器
        </h1>

        <div className="relative mt-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
             className="input pl-10 py-3 bg-white/80 dark:bg-slate-800/80 shadow-md border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-orange-500"
             placeholder="搜尋食譜..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
         {filteredRecipes.length > 0 ? (
           filteredRecipes.map(recipe => (
             <button
               key={recipe.id}
               onClick={() => setSelectedRecipe(recipe)}
               className="glass-panel p-6 text-left hover:scale-[1.02] transition-transform group flex flex-col h-full"
             >
                <div className="flex items-start justify-between mb-2">
                   <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ChefHat size={24} />
                   </div>
                   <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {recipe.baseServings}人份
                   </span>
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-200 line-clamp-1">{recipe.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                  {recipe.description || '無詳細說明'}
                </p>
                <div className="text-xs text-slate-400 border-t pt-3 dark:border-slate-700">
                   {recipe.ingredients.length} 項食材
                </div>
             </button>
           ))
         ) : (
           <div className="col-span-full py-12 text-center text-slate-500">
              {searchTerm ? '找不到相關食譜' : '還沒有食譜喔，按右下角新增！'}
           </div>
         )}
      </main>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 bg-orange-500 hover:bg-orange-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/30 z-40 transition-transform hover:scale-110 active:scale-95"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Calculator Modal */}
      {selectedRecipe && (
        <RecipeCalculator 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          onAdd={addRecipe}
          onDelete={(id) => {
             if (confirm('確定要刪除這個食譜嗎？')) {
                deleteRecipe(id);
                setSelectedRecipe(null);
             }
          }}
        />
      )}

      {/* Add Modal */}
      <AddRecipeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addRecipe}
      />
    </div>
  );
}
