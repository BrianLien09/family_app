/**
 * LocalStorage 快取寫入。
 * 為什麼集中處理：快取只是加速首屏，真正的資料在 Firestore；
 * 空間不足（QuotaExceededError）時不該讓開發畫面跳出錯誤，也不該影響雲端儲存。
 */

// 舊版本留下、目前程式不再寫入的鍵；空間不足時優先清掉它們再重試
const LEGACY_KEY_PATTERNS: readonly RegExp[] = [
  /^family-(dates|recipes)$/,
  /^restock_cache_v1_/,
  /^schedule_cache_(?!v2_)/,
  /^category_time_presets_cache$/,
  /^user_custom_categories$/,
];

// 同一個鍵只提示一次，避免 Firestore 每次推送都重複刷 console
const warnedKeys = new Set<string>();

function isQuotaError(error: unknown): boolean {
  // 用 name 判斷而非 instanceof DOMException：部分瀏覽器回報的錯誤類別不同，名稱是共通的
  return typeof error === 'object' && error !== null && 'name' in error
    && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

/** 移除舊版快取鍵，回傳移除的數量 */
function removeLegacyKeys(): number {
  const staleKeys: string[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && LEGACY_KEY_PATTERNS.some(pattern => pattern.test(key))) staleKeys.push(key);
  }
  staleKeys.forEach(key => localStorage.removeItem(key));
  return staleKeys.length;
}

/** 寫入快取；成功回傳 true。失敗只記錄警告，呼叫端不需另外處理 */
export function writeLocalCache(key: string, value: unknown): boolean {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (isQuotaError(error) && removeLegacyKeys() > 0) {
      try {
        localStorage.setItem(key, serialized);
        return true;
      } catch {
        // 清掉舊鍵仍不夠，落到下方的警告
      }
    }
    if (!warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(`本機快取 ${key} 寫入失敗，將直接使用雲端資料：`, error);
    }
    return false;
  }
}
