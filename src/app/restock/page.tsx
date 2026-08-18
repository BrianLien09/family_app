'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, Boxes, Plus, RefreshCw } from 'lucide-react';
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
    isLoaded,
    isRefreshing,
    refresh,
  } = useRestockItems();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RestockItem | null>(null);

  useEffect(() => {
    if (isLoaded && !auth.currentUser) {
      toast('\u8acb\u5148\u767b\u5165\uff0c\u88dc\u8ca8\u8cc7\u6599\u624d\u6703\u540c\u6b65\u5230\u5168\u5bb6\u5171\u7528\u6e05\u55ae', {
        icon: '\ud83d\uded2',
        duration: 5000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
        },
      });
    }
  }, [isLoaded]);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftPrediction = getRestockPrediction(left);
      const rightPrediction = getRestockPrediction(right);

      if (leftPrediction.isDue !== rightPrediction.isDue) {
        return leftPrediction.isDue ? -1 : 1;
      }

      return leftPrediction.predictedDueDate.localeCompare(rightPrediction.predictedDueDate);
    });
  }, [items]);

  const dueItems = useMemo(() => (
    items.filter((item) => getRestockPrediction(item).isDue)
  ), [items]);

  const reminderPendingItems = useMemo(() => (
    items.filter((item) => {
      const prediction = getRestockPrediction(item);
      return prediction.isDue && !prediction.reminderAlreadySent;
    })
  ), [items]);

  if (!isLoaded) {
    return <CapybaraLoader label={'\u6b63\u5728\u6574\u7406\u88dc\u8ca8\u7bc0\u594f...'} />;
  }

  return (
    <div className="container mx-auto min-h-screen max-w-5xl px-4 py-8 pt-20">
      <section className="mb-6 overflow-hidden rounded-[28px] border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] p-6 shadow-[0_16px_40px_rgba(95,113,134,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#5f7186]">
              {'\u5bb6\u5ead\u88dc\u8ca8\u63d0\u9192'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#3d3a36] sm:text-4xl">
              {'\u8b93\u885b\u751f\u7d19\u3001\u725b\u5976\u3001\u6d17\u7897\u7cbe\u5728\u898b\u5e95\u524d\u5148\u88ab\u60f3\u8d77\u4f86\u3002'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#5f6368] sm:text-base">
              {'\u6e05\u55ae\u6703\u8a18\u4f4f\u6bcf\u6b21\u88dc\u8ca8\u65e5\u671f\uff0c\u7528\u6b77\u53f2\u7bc0\u594f\u548c\u4f60\u8a2d\u5b9a\u7684\u983b\u7387\u4e00\u8d77\u63a8\u7b97\u4e0b\u4e00\u6b21\u63d0\u9192\uff0c\u4e26\u628a\u8a72\u63d0\u9192\u548c\u5bb6\u5ead\u884c\u7a0b\u5408\u4f75\u6210\u540c\u4e00\u5247 LINE \u8a0a\u606f\u3002'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-2 rounded-2xl bg-[#e6e2d8] px-4 py-3 text-sm font-medium text-[#3d3a36] transition-all hover:bg-[#dcd0c2]/70"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {'\u91cd\u65b0\u6574\u7406'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-[#b87e6b] px-5 py-3 text-sm font-bold text-[#f0ece1] shadow-[0_12px_24px_rgba(184,126,107,0.18)] transition-all hover:bg-[#a66a58]"
            >
              <Plus size={16} />
              {'\u65b0\u589e\u88dc\u8ca8\u9805\u76ee'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-[#e6e2d8]/90 p-4">
            <div className="flex items-center gap-2 text-[#5f7186]">
              <Boxes size={18} />
              <p className="text-sm font-medium">{'\u76ee\u524d\u8ffd\u8e64'}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#3d3a36]">{items.length}</p>
            <p className="mt-1 text-xs text-[#5f6368]">{'\u5e38\u5099\u54c1\u9805\u76ee'}</p>
          </div>

          <div className="rounded-3xl bg-[#e6e2d8]/90 p-4">
            <div className="flex items-center gap-2 text-[#b87e6b]">
              <BellRing size={18} />
              <p className="text-sm font-medium">{'\u5f85\u88dc\u8ca8'}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#3d3a36]">{dueItems.length}</p>
            <p className="mt-1 text-xs text-[#5f6368]">{'\u4eca\u5929\u4ee5\u524d\u61c9\u8a72\u88dc\u8ca8\u7684\u9805\u76ee'}</p>
          </div>

          <div className="rounded-3xl bg-[#e6e2d8]/90 p-4">
            <div className="flex items-center gap-2 text-[#5f7186]">
              <BellRing size={18} />
              <p className="text-sm font-medium">{'\u5c1a\u672a\u63a8\u64ad'}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#3d3a36]">{reminderPendingItems.length}</p>
            <p className="mt-1 text-xs text-[#5f6368]">{'\u4e0b\u4e00\u8f2a LINE \u6703\u512a\u5148\u5e36\u51fa\u7684\u88dc\u8ca8\u63d0\u9192'}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
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
            />
          ))
        ) : (
          <div className="rounded-[28px] border-2 border-dashed border-[#dcd0c2] bg-[#f0ece1] px-6 py-16 text-center text-[#3d3a36]">
            <p className="text-xl font-bold">{'\u9084\u6c92\u6709\u88dc\u8ca8\u9805\u76ee'}</p>
            <p className="mt-2 text-sm text-[#5f6368]">
              {'\u5148\u628a\u5bb6\u88e1\u5e38\u7528\u7684\u7269\u54c1\u52a0\u9032\u4f86\uff0c\u4e4b\u5f8c\u6bcf\u6b21\u88dc\u8ca8\u52fe\u4e00\u4e0b\uff0c\u7cfb\u7d71\u5c31\u80fd\u958b\u59cb\u5b78\u7fd2\u7bc0\u594f\u3002'}
            </p>
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
          onSubmit={(data) => {
            if (editingItem) {
              updateItem(editingItem.id, data);
            } else {
              addItem(data);
            }

            setIsModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
