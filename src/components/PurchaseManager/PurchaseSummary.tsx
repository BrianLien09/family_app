'use client';

import { countPurchases, formatPurchasePrice, sumPurchasePrices, PURCHASE_CATEGORIES, PurchaseItem } from '@/lib/purchases';
import { FAMILY_MEMBERS, MEMBER_COLORS } from '@/types';

interface PurchaseSummaryProps { items: PurchaseItem[]; categoryNames?: string[]; }
const colors = ['#818cf8', '#5f7186', '#b87e6b', '#8a9276', '#b49a70', '#99859b', '#7aa9a1', '#cc9b8b', '#8aa3c0', '#b7a0bd'];

export default function PurchaseSummary({ items, categoryNames }: PurchaseSummaryProps) {
  const categories = countPurchases(items, 'category');
  const members = countPurchases(items, 'beneficiary');
  const platformCount = new Set(items.map(item => item.platform)).size;
  const totals = sumPurchasePrices(items);
  const circumference = 2 * Math.PI * 54;
  const categoryOrder = [...new Set([...PURCHASE_CATEGORIES, ...(categoryNames ?? categories.map(category => category.name))])];
  const categoryColor = (name: string) => {
    const index = categoryOrder.indexOf(name);
    return colors[index] ?? `hsl(${Math.round(index * 137.5) % 360} 30% 55%)`;
  };

  return <section aria-label="購買紀錄統計" className="space-y-4">
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {[
        { label: '購買紀錄', value: items.length, color: 'text-[#5f7186]' },
        { label: '購買分類', value: categories.length, color: 'text-[#b87e6b]' },
        { label: '購買平台', value: platformCount, color: 'text-[#818cf8]' },
      ].map(stat => <div key={stat.label} className="glass-card flex flex-col items-center justify-center gap-1 p-3 text-center sm:p-5">
        <span className="whitespace-nowrap text-xs text-[#5f6368] sm:text-sm">{stat.label}</span>
        <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${stat.color}`}>{stat.value}</span>
      </div>)}
    </div>
    {items.some(item => item.price !== null || item.priceCny !== null) && <div className="glass-card flex flex-wrap items-center gap-x-6 gap-y-2 p-5" aria-label="依幣別分開合計">
      <h2 className="text-sm font-bold">已記錄金額</h2>
      {items.some(item => item.price !== null) && <span className="break-words text-lg font-bold tabular-nums text-[#b87e6b]">{formatPurchasePrice(totals.twd)}</span>}
      {items.some(item => item.priceCny !== null) && <span className="break-words text-lg font-bold tabular-nums text-[#5f7186]">{formatPurchasePrice(totals.cny, 'CNY')}</span>}
    </div>}
    {items.length > 0 && <div className="grid min-w-0 gap-4 md:grid-cols-2">
      <div className="glass-card min-w-0 p-5">
        <h2 className="mb-4 text-sm font-bold">購買分類占比</h2>
        <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
          <svg viewBox="0 0 140 140" width="140" height="140" className="h-36 w-36 shrink-0" role="img" aria-label={`分類占比，共 ${items.length} 筆購買紀錄`}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="#dcd0c2" strokeWidth="14" />
            {categories.map(({ name, count }, index) => {
              const length = count / items.length * circumference;
              const start = categories.slice(0, index).reduce((sum, category) => sum + category.count, 0) / items.length * circumference;
              return <circle key={name} cx="70" cy="70" r="54" fill="none" stroke={categoryColor(name)} strokeWidth="14" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 70 70)"><title>{name}：{count} 筆，{Math.round(count / items.length * 100)}%</title></circle>;
            })}
            <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="700" fill="#3d3a36">{items.length}</text>
            <text x="70" y="90" textAnchor="middle" fontSize="13" fill="#5f6368">筆紀錄</text>
          </svg>
          <ul className="w-full min-w-0 flex-1 space-y-2.5 text-sm sm:w-auto">
            {categories.map(({ name, count }) => <li key={name} className="flex items-center gap-2">
              <svg width="8" height="8" className="shrink-0" aria-hidden="true"><circle cx="4" cy="4" r="4" fill={categoryColor(name)} /></svg>
              <span className="min-w-0 flex-1 break-words">{name}</span><span className="shrink-0 font-semibold tabular-nums">{count} 筆</span>
            </li>)}
          </ul>
        </div>
      </div>
      <div className="glass-card min-w-0 p-5">
        <h2 className="mb-4 text-sm font-bold">使用對象分布</h2>
        <div className="space-y-3">
          {FAMILY_MEMBERS.map(name => {
            const count = members.find(member => member.name === name)?.count ?? 0;
            return <div key={name} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
              <span>{name}</span><svg width="100%" height="12" className="h-3 w-full" role="img" aria-label={`${name} ${count} 筆`}><rect width="100%" height="12" rx="6" fill="#e6e2d8" /><rect width={`${count / items.length * 100}%`} height="12" rx="6" fill={MEMBER_COLORS[name]} /></svg><span className="text-right font-semibold tabular-nums">{count} 筆</span>
            </div>;
          })}
        </div>
      </div>
    </div>}
  </section>;
}
