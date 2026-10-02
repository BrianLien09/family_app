'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AddRestockModal from '@/components/RestockManager/AddRestockModal';
import RestockCard from '@/components/RestockManager/RestockCard';
import CapybaraLoader from '@/components/CapybaraLoader';
import { auth } from '@/lib/firebase';
import { getRestockPrediction } from '@/lib/restock';
import { useRestockItems } from '@/hooks/useRestockItems';
import { RestockItem } from '@/types';

export default function RestockPage() {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    markPurchased,
    adjustStock,
    isLoaded,
    isRefreshing,
    refresh,
  } = useRestockItems();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RestockItem | null>(null);

  useEffect(() => {
    if (isLoaded && !auth.currentUser) {
      toast('請先登入，補貨資料才會同步到全家共用清單', {
        icon: '🛒',
        duration: 5000,
        style: { background: '#333', color: '#fff', borderRadius: '10px' },
      });
    }
  }, [isLoaded]);

  const sortedItems = useMemo(() => (
    [...items].sort((left, right) => {
      const leftPrediction = getRestockPrediction(left);
      const rightPrediction = getRestockPrediction(right);

      if (leftPrediction.isDue !== rightPrediction.isDue) {
        return leftPrediction.isDue ? -1 : 1;
      }

      return leftPrediction.predictedDueDate.localeCompare(rightPrediction.predictedDueDate);
    })
  ), [items]);

  const dueItems = useMemo(() => (
    items.filter((item) => getRestockPrediction(item).isDue)
  ), [items]);

  const lowStockItems = useMemo(() => (
    items.filter((item) => (
      item.currentStock !== undefined
      && item.lowStockThreshold !== undefined
      && item.currentStock <= item.lowStockThreshold
    ))
  ), [items]);

  if (!isLoaded) {
    return <CapybaraLoader label="正在整理補貨清單..." />;
  }

  return (
    <div className="container mx-auto min-h-screen max-w-4xl px-4 py-8 pt-24">
      <header className="mb-6 flex flex-col gap-4 border-b border-dashed border-[#dcd0c2] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#3d3a36]">庫存與補貨</h1>
            <span className="rounded-full bg-[#5f7186]/10 px-2.5 py-1 text-xs font-bold text-[#5f7186]">共 {items.length} 項</span>
            {lowStockItems.length > 0 && (
              <span className="rounded-full bg-[#b87e6b]/15 px-2.5 py-1 text-xs font-bold text-[#b87e6b]">庫存不足 {lowStockItems.length} 項</span>
            )}
            {dueItems.length > 0 && (
              <span className="rounded-full bg-[#b87e6b]/15 px-2.5 py-1 text-xs font-bold text-[#b87e6b]">待補 {dueItems.length} 項</span>
            )}
          </div>
          <p className="mt-2 text-sm text-[#5f6368]">追蹤家中庫存，並依採買節奏提醒補貨。</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl p-3 text-[#5f6368] transition-colors hover:bg-[#dcd0c2]/50 hover:text-[#3d3a36]"
            aria-label="重新整理補貨清單"
            title="重新整理"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#b87e6b] px-4 py-3 text-sm font-bold text-[#f0ece1] shadow-[0_8px_20px_rgba(184,126,107,0.18)] transition-colors hover:bg-[#a66a58]"
          >
            <Plus size={17} />
            新增項目
          </button>
        </div>
      </header>

      <section className="space-y-3" aria-label="補貨項目">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <RestockCard
              key={item.id}
              item={item}
              onEdit={(selectedItem) => {
                setEditingItem(selectedItem);
                setIsModalOpen(true);
              }}
              onDelete={deleteItem}
              onMarkPurchased={markPurchased}
              onAdjustStock={adjustStock}
            />
          ))
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] px-6 py-12 text-center text-[#3d3a36]">
            <p className="text-lg font-bold">還沒有庫存項目</p>
            <p className="mt-2 text-sm text-[#5f6368]">先加入衛生紙、牛奶等常備品，開始追蹤庫存。</p>
          </div>
        )}
      </section>

      {isModalOpen && (
        <AddRestockModal
          key={editingItem?.id ?? 'new'}
          isOpen
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          initialData={editingItem}
          onSubmit={async (data) => {
            return editingItem ? updateItem(editingItem.id, data) : addItem(data);
          }}
        />
      )}
    </div>
  );
}
