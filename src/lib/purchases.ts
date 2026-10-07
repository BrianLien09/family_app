import { FamilyMember, FAMILY_MEMBERS } from '@/types';

export const PURCHASE_CATEGORIES = ['手機', '3C產品', '家電', '家具', '烹飪用品'];
export const PHONE_MEMORY = ['8GB', '12GB', '16GB'] as const;
export const PHONE_STORAGE = ['256GB', '512GB', '1TB'] as const;
export const PURCHASE_PLATFORMS = ['蝦皮', 'momo', '京東'];
export interface PurchaseItem {
  id: string;
  name: string;
  category: string;
  beneficiary: FamilyMember;
  purchaser: FamilyMember;
  date: string;
  platform: string;
  price: number | null;
  priceCny: number | null;
  note: string;
  memory: string | null;
  storage: string | null;
}
export type PurchaseInput = Omit<PurchaseItem, 'id'>;

export function isPurchaseInput(data: PurchaseInput): boolean {
  const validAmount = (value: number | null) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER);
  const validSpec = (value: string | null) => value === null || (typeof value === 'string' && Boolean(value.trim()) && value.length <= 30);
  const parsed = new Date(`${data.date}T00:00:00Z`);
  return Boolean(data.name.trim() && data.category.trim() && data.platform.trim())
    && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
    && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data.date
    && FAMILY_MEMBERS.includes(data.beneficiary) && FAMILY_MEMBERS.includes(data.purchaser)
    && validAmount(data.price) && validAmount(data.priceCny)
    && (data.price !== null || data.priceCny !== null)
    && (data.category !== '手機' || (validSpec(data.memory) && validSpec(data.storage)));
}

export function deserializePurchase(id: string, data: Record<string, unknown>): PurchaseItem {
  const member = (value: unknown): FamilyMember => FAMILY_MEMBERS.find(item => item === value) ?? '共同';
  const string = (value: unknown): string => typeof value === 'string' ? value : '';
  return {
    id, name: string(data.name), category: string(data.category), date: string(data.date),
    beneficiary: member(data.beneficiary), purchaser: member(data.purchaser),
    platform: string(data.platform), note: string(data.note),
    price: typeof data.price === 'number' && Number.isFinite(data.price) && data.price >= 0 ? data.price : null,
    priceCny: typeof data.priceCny === 'number' && Number.isFinite(data.priceCny) && data.priceCny >= 0 ? data.priceCny : null,
    memory: typeof data.memory === 'string' && data.memory.trim() ? data.memory.trim() : null,
    storage: typeof data.storage === 'string' && data.storage.trim() ? data.storage.trim() : null,
  };
}

export function formatPurchasePrice(price: number, currency: 'TWD' | 'CNY' = 'TWD'): string {
  const amount = new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price);
  return `${currency === 'CNY' ? '人民幣 ¥' : 'NT$'}${amount}`;
}

export function sumPurchasePrices(items: PurchaseItem[]) {
  return items.reduce((total, item) => ({ twd: total.twd + (item.price ?? 0), cny: total.cny + (item.priceCny ?? 0) }), { twd: 0, cny: 0 });
}

export function countPurchases(items: PurchaseItem[], field: 'category' | 'beneficiary') {
  const counts = new Map<string, number>();
  items.forEach(item => counts.set(item[field], (counts.get(item[field]) ?? 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
