'use client';

import { useState, useEffect } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCalculator from '@/components/RecipeManager/RecipeCalculator';
import AddRecipeModal from '@/components/RecipeManager/AddRecipeModal';
import { ChefHat, Plus, Search, RotateCw, CheckSquare, Square, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Recipe } from '@/types';
import clsx from 'clsx';
// ✨ 1. 引入 auth 和 toast
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function RecipesPage() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, deleteRecipes, isLoaded, refresh, isRefreshing } = useRecipes();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  // 批次選擇狀態
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 計算分頁
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleModalSubmit = (recipeData: Recipe) => {
    if (editingRecipe) {
      const { id, ...fieldsToUpdate } = recipeData;
      updateRecipe(editingRecipe.id, fieldsToUpdate);
    } else {
      addRecipe(recipeData);
    }
    setIsAddModalOpen(false);
    setEditingRecipe(null);
  };

  // ✨✨✨ 2. 修改這裡：在打開視窗前就先擋下來 ✨✨✨
  const openAddModal = () => {
    // 如果沒登入，直接彈出警告並「return」(不執行下面的打開視窗)
    if (!auth.currentUser) {
      toast.error("請先登入才能新增食譜喔！👨‍🍳");
      return;
    }

    setEditingRecipe(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
    // 編輯也要檢查比較保險
    if (!auth.currentUser) {
        toast.error("請先登入才能編輯食譜 🔒");
        return;
    }
    setSelectedRecipe(null);
    setEditingRecipe(recipe);
    setIsAddModalOpen(true);
  };
  
  // 批次操作函式
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecipes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecipes.map(r => r.id));
    }
  };
  
  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('請先選擇要刪除的食譜');
      return;
    }
    
    if (confirm(`確定要刪除 ${selectedIds.length} 個食譜嗎？`)) {
      deleteRecipes(selectedIds);
      setSelectedIds([]);
      setBatchMode(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center text-[#3d3a36]">載入中...</div>;

  return (
    <div className="container min-h-screen pb-32 pt-28">
      <header className="mb-8 px-4">
        <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-extrabold tracking-tight  text-[#b87e6b] drop-shadow-[0_2px_8px_rgba(139,121,101,0.04)]">
              食譜轉換神器
            </h1>
            
            <button 
               onClick={refresh}
               disabled={isRefreshing}
               className="p-2 rounded-full bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 text-[#3d3a36] hover:text-[#b87e6b] transition-all disabled:opacity-50"
               title="重新整理食譜"
             >
               <RotateCw 
                 size={24} 
                 className={clsx("transition-all duration-700", isRefreshing && "animate-spin")} 
               />
             </button>
        </div>
        
        {/* 批次操作工具列 */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedIds([]);
              }}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                batchMode 
                  ? "bg-[#b87e6b] text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/30" 
                  : "bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 text-[#3d3a36]"
              )}
              aria-label="批次選擇模式"
              aria-pressed={batchMode}
            >
              {batchMode ? <CheckSquare size={16} /> : <Square size={16} />}
              {batchMode ? '離開批次模式' : '批次操作'}
            </button>
            
            {batchMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 text-xs bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-[#3d3a36] transition-all duration-200"
                  aria-label="全選/取消全選"
                >
                  {selectedIds.length === filteredRecipes.length ? '取消全選' : '全選'}
                </button>
                
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#b87e6b]/20 hover:bg-[#b87e6b]/20 text-[#b87e6b] rounded-lg transition-all duration-200"
                    aria-label={`刪除選取的 ${selectedIds.length} 個項目`}
                  >
                    <Trash2 size={14} />
                    刪除 ({selectedIds.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d3a36]" size={20} />
           <input 
             className="w-full pl-10 py-3 bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50 rounded-xl text-[#f0ece1] placeholder:text-[#3d3a36] focus:outline-none focus:border-[#b87e6b]/50 transition-all hover:bg-[#dcd0c2]/50"
             placeholder="搜尋食譜..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
         {paginatedRecipes.length > 0 ? (
           paginatedRecipes.map(recipe => (
             <button
               key={recipe.id}
               onClick={() => {
                 if (batchMode) {
                   toggleSelectItem(recipe.id);
                 } else {
                   setSelectedRecipe(recipe);
                 }
               }}
               className={clsx(
                 "glass-card p-6 text-left transition-all group flex flex-col h-full border-2 border-dashed bg-[#f0ece1]",
                 batchMode 
                   ? selectedIds.includes(recipe.id)
                     ? "scale-[0.98] border-[#b87e6b]/50 bg-[#b87e6b]/20 shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/30"
                     : "hover:scale-[1.01] border-dashed border-[#dcd0c2]/50 hover:border-[#b87e6b]/50"
                   : "hover:scale-[1.02] active:scale-[0.98] border-dashed border-[#dcd0c2]/50 hover:border-[#b87e6b]/50"
               )}
             >
                {/* 批次模式勾選框 */}
                {batchMode && (
                  <div className="flex justify-end mb-2">
                    <div 
                      className={clsx(
                        "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                        selectedIds.includes(recipe.id)
                          ? "bg-[#b87e6b] border-[#b87e6b]/50" 
                          : "border-slate-500 bg-[#dcd0c2]/30"
                      )}
                    >
                      {selectedIds.includes(recipe.id) && (
                        <svg className="w-4 h-4 text-[#f0ece1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                   <div className="p-3 rounded-2xl bg-[#b87e6b]/20 text-[#b87e6b] group-hover:bg-[#b87e6b] group-hover:text-[#b87e6b] transition-all duration-200">
                      <ChefHat size={24} />
                   </div>
                   <span className="text-xs font-bold text-[#3d3a36] bg-[#dcd0c2]/30 px-2 py-1 rounded-md border-2 border-dashed border-dashed border-[#dcd0c2]/50">
                      {recipe.baseServings} 人份
                   </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#3d3a36] line-clamp-1 group-hover:text-[#b87e6b] transition-all duration-200">
                    {recipe.title}
                </h3>
                <p className="text-sm text-[#3d3a36] line-clamp-2 mb-4 flex-1 border-l-2 border-[#dcd0c2] pl-3">
                  {recipe.description || '無詳細說明'}
                </p>
                <div className="text-xs text-[#3d3a36] border-t border-dashed border-[#dcd0c2]/50 pt-3 flex items-center justify-between">
                   <span>{recipe.ingredients.length} 項食材</span>
                   <span className="text-[#b87e6b]/50 group-hover:text-[#b87e6b] text-[10px] uppercase tracking-wider font-bold">Tap to Cook</span>
                </div>
             </button>
           ))
         ) : (
           <div className="col-span-full py-20 text-center text-[#3d3a36] flex flex-col items-center">
              <ChefHat size={48} className="mb-4 opacity-20" />
              <p>{searchTerm ? '找不到相關食譜' : '還沒有食譜喔，按右下角新增！'}</p>
           </div>
         )}
      </main>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 px-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-[#3d3a36] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="上一頁"
          >
            <ChevronLeft size={16} />
            上一頁
          </button>
          
          <span className="text-sm text-[#3d3a36]">
            第 <span className="text-[#b87e6b] font-bold">{currentPage}</span> / {totalPages} 頁
            <span className="text-slate-600 ml-2">({filteredRecipes.length} 個食譜)</span>
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#dcd0c2]/30 hover:bg-[#dcd0c2]/50 rounded-lg text-[#3d3a36] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="下一頁"
          >
            下一頁
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-6 bg-gradient-to-r bg-[#b87e6b]  hover:bg-[#b87e6b] hover: text-[#f0ece1] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-[#b87e6b]/30 z-40 transition-all hover:scale-110 active:scale-95"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {selectedRecipe && (
        <RecipeCalculator 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          onDelete={(id) => {
             deleteRecipe(id);
             setSelectedRecipe(null);
          }}
          onAdd={addRecipe}
          onEdit={() => openEditModal(selectedRecipe)}
        />
      )}

      <AddRecipeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleModalSubmit}
        initialData={editingRecipe}
      />
    </div>
  );
}