'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCalculator from '@/components/RecipeManager/RecipeCalculator';
import AddRecipeModal from '@/components/RecipeManager/AddRecipeModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { AnimatePresence, m } from 'motion/react';
import { ChefHat, Plus, RotateCw, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { Recipe } from '@/types';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import SearchInput from '@/components/ui/SearchInput';
import SelectCheckbox from '@/components/ui/SelectCheckbox';
import BatchToolbar from '@/components/ui/BatchToolbar';
import EmptyState from '@/components/ui/EmptyState';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import LoadingGate from '@/components/ui/LoadingGate';
import { listItem, TAP_SCALE } from '@/lib/motion';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function RecipesPage() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, deleteRecipes, isLoaded, refresh, isRefreshing } = useRecipes();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleModalSubmit = async (recipeData: Recipe): Promise<boolean> => {
    if (editingRecipe) {
      const fieldsToUpdate = {
        title: recipeData.title,
        description: recipeData.description,
        baseServings: recipeData.baseServings,
        ingredients: recipeData.ingredients,
        cookingTime: recipeData.cookingTime,
      };
      return updateRecipe(editingRecipe.id, fieldsToUpdate);
    } else {
      return addRecipe(recipeData);
    }
  };

  // 沒登入就在開啟視窗前擋下，避免使用者填完表單才發現無法儲存
  const openAddModal = () => {
    if (!auth.currentUser) {
      toast.error("請先登入才能新增食譜喔！👨‍🍳");
      return;
    }

    setEditingRecipe(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
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

    setIsDeleteDialogOpen(true);
  };

  return (
    <LoadingGate isLoaded={isLoaded} label="正在整理家庭食譜...">
      <PageShell width="medium">
        <PageHeader
          title="食譜轉換神器"
          description="輸入人數，自動換算每項食材的用量。"
          actions={<>
            <IconButton aria-label="重新整理食譜" onClick={refresh} disabled={isRefreshing}>
              <RotateCw size={20} className={clsx(isRefreshing && 'motion-safe:animate-spin')} />
            </IconButton>
            <Button
              variant={batchMode ? 'primary' : 'soft'}
              aria-pressed={batchMode}
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedIds([]);
              }}
            >
              {batchMode ? <CheckSquare size={16} aria-hidden="true" /> : <Square size={16} aria-hidden="true" />}
              {batchMode ? '離開批次模式' : '批次操作'}
            </Button>
          </>}
        />

        <SearchInput
          className="mb-4"
          aria-label="搜尋食譜"
          placeholder="搜尋食譜..."
          value={searchTerm}
          onChange={value => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />

        <AnimatePresence initial={false}>
          {batchMode && (
            <div key="batch-toolbar" className="mb-4">
              <BatchToolbar
                selectedCount={selectedIds.length}
                totalCount={filteredRecipes.length}
                onToggleAll={toggleSelectAll}
                onDelete={handleBatchDelete}
              />
            </div>
          )}
        </AnimatePresence>

        {paginatedRecipes.length > 0 ? (
          // initial={false}：頁面首次進入由路由轉場負責，只有後續新增／刪除／篩選才播放卡片進出場
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {paginatedRecipes.map(recipe => {
                const isSelected = selectedIds.includes(recipe.id);
                return (
                  <m.li key={recipe.id} layout="position" variants={listItem} initial="hidden" animate="visible" exit="exit" className="list-none">
                    <m.button
                      type="button"
                      aria-pressed={batchMode ? isSelected : undefined}
                      onClick={() => {
                        if (batchMode) toggleSelectItem(recipe.id);
                        else setSelectedRecipe(recipe);
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={TAP_SCALE}
                      className={clsx(
                        'glass-card group flex h-full w-full flex-col p-6 text-left transition-colors duration-200',
                        isSelected ? 'border-[#b87e6b] bg-[#b87e6b]/10' : 'hover:border-[#b87e6b]/60',
                      )}
                    >
                      {batchMode && (
                        <span className="mb-2 flex justify-end">
                          <SelectCheckbox checked={isSelected} />
                        </span>
                      )}
                      <span className="mb-3 flex items-start justify-between">
                        <span className="rounded-2xl bg-[#b87e6b]/20 p-3 text-[#b87e6b] transition-colors duration-200 group-hover:bg-[#b87e6b] group-hover:text-[#f0ece1]">
                          <ChefHat size={24} aria-hidden="true" />
                        </span>
                        <span className="rounded-md border-2 border-dashed border-[#dcd0c2]/50 bg-[#dcd0c2]/30 px-2 py-1 text-xs font-bold text-[#3d3a36]">
                          {recipe.baseServings} 人份
                        </span>
                      </span>
                      <h3 className="mb-2 line-clamp-1 text-xl font-bold text-[#3d3a36] transition-colors duration-200 group-hover:text-[#b87e6b]">
                        {recipe.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 flex-1 border-l-2 border-[#dcd0c2] pl-3 text-sm text-[#3d3a36]">
                        {recipe.description || '無詳細說明'}
                      </p>
                      <span className="flex items-center justify-between border-t border-dashed border-[#dcd0c2]/50 pt-3 text-xs text-[#3d3a36]">
                        <span>{recipe.ingredients.length} 項食材</span>
                        <span className="text-[10px] font-bold tracking-wider text-[#b87e6b]/70 transition-colors duration-200 group-hover:text-[#b87e6b]">
                          {batchMode ? '點擊選取' : '點擊換算'}
                        </span>
                      </span>
                    </m.button>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <EmptyState
            icon={ChefHat}
            title={searchTerm ? '找不到相關食譜' : '還沒有食譜'}
            description={searchTerm ? '試試其他關鍵字。' : '點擊右下角的「＋」新增第一份食譜。'}
          />
        )}

        {totalPages > 1 && (
          <nav aria-label="食譜分頁" className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} aria-label="上一頁">
              <ChevronLeft size={16} aria-hidden="true" />
              上一頁
            </Button>
            <span className="text-sm text-[#3d3a36]">
              第 <span className="font-bold text-[#b87e6b]">{currentPage}</span> / {totalPages} 頁
              <span className="ml-2 text-[#5f6368]">({filteredRecipes.length} 個食譜)</span>
            </span>
            <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} aria-label="下一頁">
              下一頁
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </nav>
        )}

        <m.button
          type="button"
          onClick={openAddModal}
          aria-label="新增食譜"
          whileHover={{ scale: 1.06 }}
          whileTap={TAP_SCALE}
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#b87e6b] text-[#f0ece1] shadow-[0_8px_20px_rgba(184,126,107,0.35)] transition-colors duration-200 hover:bg-[#a66a58]"
        >
          <Plus size={28} strokeWidth={3} aria-hidden="true" />
        </m.button>

        <AnimatePresence>
          {selectedRecipe && (
            <RecipeCalculator
              key={selectedRecipe.id}
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
        </AnimatePresence>

        <AnimatePresence>
          {isAddModalOpen && (
            <AddRecipeModal
              key={editingRecipe?.id ?? 'new'}
              isOpen
              onClose={() => setIsAddModalOpen(false)}
              onSubmit={handleModalSubmit}
              initialData={editingRecipe}
            />
          )}
        </AnimatePresence>

        <ConfirmDialog
          danger
          isOpen={isDeleteDialogOpen}
          title="刪除選取的食譜？"
          description={`將刪除 ${selectedIds.length} 個食譜，此操作可在完成後透過提示訊息復原。`}
          confirmLabel="刪除食譜"
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            deleteRecipes(selectedIds);
            setSelectedIds([]);
            setBatchMode(false);
            setIsDeleteDialogOpen(false);
          }}
        />
      </PageShell>
    </LoadingGate>
  );
}
