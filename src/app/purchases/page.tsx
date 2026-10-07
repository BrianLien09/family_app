'use client';

import { useRef, useState } from 'react';
import { CalendarDays, Plus, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import MemberFilter from '@/components/ExpenseManager/MemberFilter';
import PurchaseModal from '@/components/PurchaseManager/PurchaseModal';
import PurchaseRecord from '@/components/PurchaseManager/PurchaseRecord';
import PurchaseSummary from '@/components/PurchaseManager/PurchaseSummary';
import ConfirmDialog from '@/components/ConfirmDialog';
import CapybaraLoader from '@/components/CapybaraLoader';
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

  if (!isLoaded) return <CapybaraLoader label="正在整理家庭購買紀錄…" />;

  return <div className="container mx-auto min-h-screen max-w-3xl space-y-5 px-4 pb-10 pt-24 text-[#3d3a36] motion-safe:animate-fade-in">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold tracking-tight">家庭購買紀錄</h1><p className="mt-1 text-sm text-[#5f6368]">記下全家的重要添購。</p></div>
      <div className="flex items-center gap-2">
        <button onClick={refresh} disabled={isRefreshing} className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#dcd0c2] bg-[#dcd0c2]/30 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#dcd0c2]/50 disabled:opacity-50" aria-label="重新整理購買紀錄"><RefreshCw size={16} className={isRefreshing ? 'motion-safe:animate-spin' : ''} /><span>重新整理</span></button>
        <button onClick={() => { setEditing(null); setIsOpen(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5f7186] px-4 py-2.5 text-sm font-bold text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] transition-colors hover:bg-[#47576b] active:scale-95 motion-reduce:transform-none sm:flex-none"><Plus size={16} />新增</button>
      </div>
    </header>

    <section aria-label="篩選使用對象"><MemberFilter selectedMember={member} onChange={setMember} /></section>
    {!auth.currentUser && <p className="rounded-xl bg-[#dcd0c2]/30 px-4 py-3 text-sm text-[#5f6368]">登入後即可查看與儲存全家共用的購買紀錄。</p>}
    {hasSyncError && <p role="alert" className="rounded-xl border border-[#b87e6b] bg-[#f0ece1] p-4 text-sm">購買紀錄同步失敗。請確認網路與存取權限後，按重新整理；目前顯示已載入的資料。</p>}
    {(!hasSyncError || items.length > 0) && <PurchaseSummary items={filtered} categoryNames={categories} />}

    <section aria-label="搜尋與分類篩選" className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 text-[#5f6368]" size={17} /><input className="w-full rounded-xl border-2 border-dashed border-[#dcd0c2]/70 bg-[#f0ece1] py-2.5 pl-10 pr-4 text-sm" aria-label="搜尋購買紀錄" placeholder="搜尋品名、平台、購買人或備註" value={search} onChange={e => setSearch(e.target.value)} /></label>
        {hasFilters && <button onClick={() => { setSearch(''); setCategory(''); setMember('全體'); }} className="shrink-0 rounded-lg px-2 py-2 text-sm text-[#5f7186] hover:bg-[#dcd0c2]/30">清除</button>}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="篩選分類">
        {['', ...categories].map(value => <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value} className={`max-w-full break-words rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${category === value ? 'border-[#5f7186] bg-[#5f7186]/10 text-[#5f7186]' : 'border-dashed border-[#dcd0c2]/70 bg-[#dcd0c2]/20 hover:bg-[#dcd0c2]/40'}`}>{value || '所有分類'}</button>)}
      </div>
    </section>

    <section aria-label="購買時間軸" className="space-y-5">
      <div className="flex items-center justify-between"><h2 className="text-base font-bold">購買紀錄</h2>{(!hasSyncError || items.length > 0) && <span className="text-sm text-[#5f6368]">{filtered.length} 筆</span>}</div>
      {!filtered.length && (!hasSyncError || items.length > 0) && <div className="rounded-2xl border-2 border-dashed border-[#dcd0c2]/70 bg-[#dcd0c2]/30 p-8 text-center"><ShoppingBag className="mx-auto mb-3 text-[#5f7186]" size={28} /><h3 className="font-bold">{hasFilters ? '找不到符合條件的紀錄' : '還沒有購買紀錄'}</h3><p className="mt-2 text-sm text-[#5f6368]">{hasFilters ? '試試其他關鍵字或清除篩選。' : '點擊「新增」，留下家庭的重要添購。'}</p></div>}
      {years.map(year => <div key={year} className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5f7186]"><CalendarDays size={16} />{year} 年</h3>
        {filtered.filter(item => item.date.slice(0, 4) === year).map(item => <PurchaseRecord key={item.id} item={item} isDeleting={isDeleting} onEdit={selected => { setEditing(selected); setIsOpen(true); }} onDelete={setDeleting} />)}
      </div>)}
    </section>

    {isOpen && <PurchaseModal key={editing?.id ?? 'new'} item={editing} categories={categories} choiceOptions={choiceOptions} onClose={() => setIsOpen(false)} onSave={data => savePurchase(data, editing?.id)} />}
    <ConfirmDialog isOpen={Boolean(deleting)} title="刪除購買紀錄？" description={`「${deleting?.name ?? ''}」將永久刪除。`} confirmLabel={isDeleting ? '刪除中…' : '刪除紀錄'} onClose={() => { if (!deletePending.current) setDeleting(null); }} onConfirm={async () => {
      if (!deleting || deletePending.current) return;
      deletePending.current = true; setIsDeleting(true);
      try { if (await deletePurchase(deleting.id)) setDeleting(null); }
      finally { deletePending.current = false; setIsDeleting(false); }
    }} />
  </div>;
}
