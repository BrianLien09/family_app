'use client';

import { Armchair, CookingPot, Laptop, Pencil, Plug, ShoppingBag, Smartphone, Trash2 } from 'lucide-react';
import { PurchaseItem, formatPurchasePrice } from '@/lib/purchases';
import { MEMBER_COLORS } from '@/types';

interface PurchaseRecordProps {
  item: PurchaseItem;
  isDeleting: boolean;
  onEdit: (item: PurchaseItem) => void;
  onDelete: (item: PurchaseItem) => void;
}
const icons = new Map([['手機', <Smartphone key="phone" size={19} />], ['3C產品', <Laptop key="3c" size={19} />], ['家電', <Plug key="appliance" size={19} />], ['家具', <Armchair key="furniture" size={19} />], ['烹飪用品', <CookingPot key="cooking" size={19} />]]);

export default function PurchaseRecord({ item, isDeleting, onEdit, onDelete }: PurchaseRecordProps) {
  const icon = icons.get(item.category) ?? <ShoppingBag size={19} />;
  return <article className="glass-card min-w-0 p-4 sm:p-5">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f0ece1]" style={{ backgroundColor: MEMBER_COLORS[item.beneficiary] }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <h3 className="min-w-0 break-words font-bold">{item.name}</h3>
          <span className="max-w-full break-words rounded-md bg-[#dcd0c2]/30 px-2 py-0.5 text-xs text-[#5f6368]">{item.category}</span>
          <span className="ml-3 max-w-full break-words rounded-md px-2.5 py-1 text-xs font-medium text-[#3d3a36]" style={{ backgroundColor: `${MEMBER_COLORS[item.beneficiary]}26` }}>使用對象：{item.beneficiary}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs leading-5 text-[#5f6368] sm:text-sm">
          <span>日期：<time dateTime={item.date}>{item.date}</time></span>
          {item.category === '手機' && <span className="min-w-0 break-words text-[#5f7186]">規格：{item.memory || item.storage ? `記憶體 ${item.memory ?? '未提供'}／儲存空間 ${item.storage ?? '未提供'}` : '未提供'}</span>}
          <span className="min-w-0 break-words">購買平台：{item.platform || '未提供'}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 break-words text-lg font-bold text-[#b87e6b]">{item.price === null && item.priceCny === null && <span className="text-xs font-normal text-[#5f6368]">未填價格</span>}{item.price !== null && <span>{formatPurchasePrice(item.price)}</span>}{item.priceCny !== null && <span>{formatPurchasePrice(item.priceCny, 'CNY')}</span>}</div>
        <div className="mt-2 text-xs leading-5 text-[#5f6368] sm:text-sm">購買人：<strong className="font-semibold text-[#3d3a36]">{item.purchaser}</strong></div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
        <button onClick={() => onEdit(item)} aria-label={`編輯 ${item.name}`} className="rounded-lg p-2 text-[#3d3a36] transition-colors hover:bg-[#5f7186]/10 hover:text-[#5f7186]"><Pencil size={17} /></button>
        <button disabled={isDeleting} onClick={() => onDelete(item)} aria-label={`刪除 ${item.name}`} className="rounded-lg p-2 text-[#3d3a36] transition-colors hover:bg-[#b87e6b]/10 hover:text-[#b87e6b] disabled:opacity-50"><Trash2 size={17} /></button>
      </div>
    </div>
    {item.note && <details className="mt-3 border-t border-dashed border-[#dcd0c2] pt-3 text-sm text-[#5f6368]"><summary className="w-fit cursor-pointer hover:text-[#5f7186]">備註</summary><p className="mt-2 whitespace-pre-wrap break-words leading-6">{item.note}</p></details>}
  </article>;
}
