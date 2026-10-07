'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { collection, onSnapshot, orderBy, query, type OrderByDirection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, db } from '@/lib/firebase';

interface SharedCollectionOptions<T> {
  collectionName: string;
  cachePrefix: string;
  orderField: string;
  orderDirection: OrderByDirection;
  deserialize: (id: string, data: Record<string, unknown>) => T;
}

export function useSharedCollection<T>(options: SharedCollectionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSyncError, setHasSyncError] = useState(false);
  const restartRef = useRef<(() => void) | null>(null);
  const confirmedDataRef = useRef<T[]>([]);
  const sessionRef = useRef(0);
  const renderSession = sessionRef.current;
  const renderUid = auth.currentUser?.uid;
  const { collectionName, cachePrefix, orderField, orderDirection, deserialize } = options;

  const updateCache = useCallback((items: T[], uid: string | undefined = auth.currentUser?.uid) => {
    if (!uid) return;
    try {
      localStorage.setItem(`${cachePrefix}${uid}`, JSON.stringify(items));
    } catch (error) {
      // 快取不可用不代表雲端儲存失敗。
      console.error('更新本機快取失敗：', error);
    }
  }, [cachePrefix]);

  useEffect(() => {
    let stopSnapshot: (() => void) | undefined;
    let generation = 0;
    let disposed = false;

    const stop = () => {
      generation += 1;
      stopSnapshot?.();
      stopSnapshot = undefined;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (disposed) return;
      sessionRef.current += 1;
      stop();
      restartRef.current = null;
      setData([]);
      confirmedDataRef.current = [];
      setIsRefreshing(false);
      setHasSyncError(false);
      if (!user) {
        setIsLoaded(true);
        return;
      }

      let hasCache = false;
      try {
        const cached = localStorage.getItem(`${cachePrefix}${user.uid}`);
        if (cached) {
          const parsed: unknown = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setData(parsed as T[]);
            confirmedDataRef.current = parsed as T[];
            hasCache = true;
          }
        }
      } catch (error) {
        console.error('讀取本機快取失敗：', error);
      }
      setIsLoaded(hasCache);

      const subscribe = () => {
        stop();
        const currentGeneration = generation;
        const isCurrent = () => !disposed && currentGeneration === generation && auth.currentUser?.uid === user.uid;
        const dataQuery = query(collection(db, collectionName), orderBy(orderField, orderDirection));
        stopSnapshot = onSnapshot(dataQuery, { includeMetadataChanges: true }, (snapshot) => {
          if (!isCurrent()) return;
          // 待確認寫入由原本的樂觀更新處理，避免被當成已儲存的資料。
          if (snapshot.metadata.hasPendingWrites) return;
          const items = snapshot.docs.map((item) => deserialize(item.id, item.data()));
          if (snapshot.metadata.fromCache) {
            // Firestore 記憶體快取可能不完整，不覆蓋先前已確認的本機資料。
            if (!hasCache) {
              setData(items);
              confirmedDataRef.current = items;
            }
            setIsLoaded(true);
            return;
          }
          hasCache = true;
          setHasSyncError(false);
          confirmedDataRef.current = items;
          setData(items);
          updateCache(items, user.uid);
          setIsLoaded(true);
          setIsRefreshing(false);
        }, (error) => {
          if (!isCurrent()) return;
          console.error(`${collectionName} 即時同步失敗：`, error);
          setHasSyncError(true);
          toast.error('同步失敗，目前保留已載入資料，請重新整理再試');
          setIsLoaded(true);
          setIsRefreshing(false);
        });
      };

      restartRef.current = subscribe;
      subscribe();
    });

    return () => {
      disposed = true;
      sessionRef.current += 1;
      restartRef.current = null;
      unsubscribeAuth();
      stop();
    };
  }, [collectionName, cachePrefix, orderField, orderDirection, deserialize, updateCache]);

  const refresh = useCallback(() => {
    if (!restartRef.current) return;
    setIsRefreshing(true);
    restartRef.current();
  }, []);

  const restoreData = useCallback(() => {
    // 還原最新已確認資料，避免舊備份覆蓋其他家人剛完成的修改。
    setData(confirmedDataRef.current);
    updateCache(confirmedDataRef.current);
  }, [updateCache]);

  const isCurrentSession = () => sessionRef.current === renderSession && auth.currentUser?.uid === renderUid;
  // 寫入 Promise 可能比登出或切換帳號更晚完成，舊操作不可更新新帳號的畫面與快取。
  const setVisibleData: Dispatch<SetStateAction<T[]>> = value => {
    if (isCurrentSession()) setData(value);
  };
  const updateVisibleCache = (items: T[]) => {
    if (isCurrentSession()) updateCache(items, renderUid);
  };
  const restoreVisibleData = () => {
    if (isCurrentSession()) restoreData();
  };

  return { data, setData: setVisibleData, isLoaded, isRefreshing, hasSyncError, refresh, updateCache: updateVisibleCache, restoreData: restoreVisibleData };
}
