'use client';

import { useRef, useState } from 'react';
import { CalendarDays, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import MemberFilter from '@/components/ExpenseManager/MemberFilter';
import PurchaseModal from '@/components/PurchaseManager/PurchaseModal';
import PurchaseRecord from '@/components/PurchaseManager/PurchaseRecord';
import PurchaseSummary from '@/components/PurchaseManager/PurchaseSummary';
import ConfirmDialog from '@/components/ConfirmDialog';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import LoadingGate from '@/components/ui/LoadingGate';
import { usePurchases } from '@/hooks/usePurchases';
import { PurchaseItem } from '@/lib/purchases';
import { FamilyMember } from '@/types';
import { auth } from '@/lib/firebase';

export default function PurchasesPage() {
  const { items, categories, choiceOptions, savePurchase, deletePurchase, hasSyncError, isLoaded, isRefreshing, refresh } = usePurchases();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [member, setMember] = useState<FamilyMember | '全體'>('全體');
  const [editing, setEditing] = useState<PurchaseItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState<PurchaseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePending = useRef(false);
  const filtered = items.filter(item => (!category || item.category === category)
    && (member === '全體' || item.beneficiary === member)
    && `${item.name} ${item.platform} ${item.note} ${item.purchaser}`.toLowerCase().includes(search.trim().toLowerCase()));
  const years = [...new Set(filtered.map(item => item.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const hasFilters = Boolean(category || member !== '全體' || search);
  const showData = !hasSyncError || items.length > 0;

  return (
    <LoadingGate isLoaded={isLoaded} label="正在整理家庭購買紀錄…">
      <PageShell>
        <PageHeader
          title="家庭購買紀錄"
          description="記下全家的重要添購。"
          actions={<>
            <Button onClick={refresh} disabled={isRefreshing} aria-label="重新整理購買紀錄">
              <RefreshCw size={16} className={clsx(isRefreshing && 'motion-safe:animate-spin')} aria-hidden="true" />
              重新整理
            </Button>
            <Button variant="secondary" onClick={() => { setEditing(null); setIsOpen(true); }}>
              <Plus size={16} aria-hidden="true" />新增
            </Button>
          </>}
        />

        <div className="space-y-5">
          <section aria-label="篩選使用對象"><MemberFilter selectedMember={member} onChange={setMember} /></section>
          {!auth.currentUser && <p className="rounded-xl bg-[#dcd0c2]/30 px-4 py-3 text-sm text-[#5f6368]">登入後即可查看與儲存全家共用的購買紀錄。</p>}
          {hasSyncError && <p role="alert" className="rounded-xl border border-[#b87e6b] bg-[#f0ece1] p-4 text-sm">購買紀錄同步失敗。請確認網路與存取權限後，按重新整理；目前顯示已載入的資料。</p>}
          {showData && <PurchaseSummary items={filtered} categoryNames={categories} />}

          <section aria-label="搜尋與分類篩選" className="space-y-3">
            <div className="flex items-center gap-2">
              <SearchInput className="flex-1" aria-label="搜尋購買紀錄" placeholder="搜尋品名、平台、購買人或備註" value={search} onChange={setSearch} />
              {hasFilters && <Button variant="ghost" onClick={() => { setSearch(''); setCategory(''); setMember('全體'); }}>清除</Button>}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="篩選分類">
              {['', ...categories].map(value => <Chip key={value} selected={category === value} onClick={() => setCategory(value)}>{value || '所有分類'}</Chip>)}
            </div>
          </section>

          <section aria-label="購買時間軸" className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">購買紀錄</h2>
              {showData && <span className="text-sm text-[#5f6368]">{filtered.length} 筆</span>}
            </div>
            {!filtered.length && showData && (
              <EmptyState
                icon={ShoppingBag}
                title={hasFilters ? '找不到符合條件的紀錄' : '還沒有購買紀錄'}
                description={hasFilters ? '試試其他關鍵字或清除篩選。' : '點擊「新增」，留下家庭的重要添購。'}
              />
            )}
            {years.map(year => <div key={year} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5f7186]"><CalendarDays size={16} />{year} 年</h3>
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.filter(item => item.date.slice(0, 4) === year).map(item => <PurchaseRecord key={item.id} item={item} isDeleting={isDeleting} onEdit={selected => { setEditing(selected); setIsOpen(true); }} onDelete={setDeleting} />)}
              </AnimatePresence>
            </div>)}
          </section>
        </div>

        <AnimatePresence>
          {isOpen && <PurchaseModal key={editing?.id ?? 'new'} item={editing} categories={categories} choiceOptions={choiceOptions} onClose={() => setIsOpen(false)} onSave={data => savePurchase(data, editing?.id)} />}
        </AnimatePresence>
        <ConfirmDialog danger isOpen={Boolean(deleting)} isBusy={isDeleting} title="刪除購買紀錄？" description={`「${deleting?.name ?? ''}」將永久刪除。`} confirmLabel={isDeleting ? '刪除中…' : '刪除紀錄'} onClose={() => { if (!deletePending.current) setDeleting(null); }} onConfirm={async () => {
          if (!deleting || deletePending.current) return;
          deletePending.current = true; setIsDeleting(true);
          try { if (await deletePurchase(deleting.id)) setDeleting(null); }
          finally { deletePending.current = false; setIsDeleting(false); }
        }} />
      </PageShell>
    </LoadingGate>
  );
}
