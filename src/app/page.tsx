'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, m } from 'motion/react';
import { useDates } from '@/hooks/useDates';
import CalendarWidget from '@/components/CalendarWidget';
import AddDateModal from '@/components/DateManager/AddDateModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Filter, X, CalendarClock, History, ChevronDown } from 'lucide-react';
import { DateItem, DateCategory } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { createCategoryColorMap, getCategoryColorStyles } from '@/lib/categoryColors';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Chip from '@/components/ui/Chip';
import SearchInput from '@/components/ui/SearchInput';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import LoadingGate from '@/components/ui/LoadingGate';
import { collapse, popIn } from '@/lib/motion';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { dates, addDate, deleteDate, deleteDates, updateDate, duplicateDate, addDateToMultipleDates, isLoaded, refresh, isRefreshing } = useDates();
  const { categories } = useCategories();
  const categoryColors = useMemo(
    () => createCategoryColorMap([
      ...categories,
      ...dates.map(item => item.category),
    ]),
    [categories, dates],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<DateItem | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | null>(null);

  // 搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<DateCategory[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 快速預覽狀態
  const [previewMode, setPreviewMode] = useState<'upcoming' | 'past' | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // 批次選擇狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 批次新增到多個日期的狀態
  const [batchAddDates, setBatchAddDates] = useState<string[]>([]);

  // 篩選後的行程
  const filteredDates = useMemo(() => {
    return dates.filter(item => {
      // 搜尋關鍵字
      const matchesSearch = searchTerm === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()));

      // 分類篩選
      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);

      // 日期區間篩選
      let matchesDateRange = true;
      if (dateRangeStart && dateRangeEnd) {
        const itemDate = new Date(item.date).getTime();
        const startDate = new Date(dateRangeStart).getTime();
        const endDate = new Date(dateRangeEnd).getTime();
        matchesDateRange = itemDate >= startDate && itemDate <= endDate;
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [dates, searchTerm, selectedCategories, dateRangeStart, dateRangeEnd]);

  // 切換分類選擇
  const toggleCategory = (category: DateCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // 清除所有篩選
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setDateRangeStart('');
    setDateRangeEnd('');
  };

  // 日期區間只有在起訖都填時才會生效，計數需與篩選邏輯一致
  const hasDateRange = Boolean(dateRangeStart && dateRangeEnd);
  const activeFilterCount = selectedCategories.length + (hasDateRange ? 1 : 0);
  const hasAnyFilter = Boolean(searchTerm) || activeFilterCount > 0;

  const closePreview = () => {
    setPreviewMode(null);
    setPreviewIndex(0);
  };

  // 計算即將到來的行程（使用篩選後的資料）
  const upcomingDates = (() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return [...filteredDates]
      .filter(d => new Date(d.date).getTime() >= todayStart)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  // 計算過往的行程（使用篩選後的資料）
  const pastDates = (() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return [...filteredDates]
      .filter(d => new Date(d.date).getTime() < todayStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 由近到遠排序
  })();

  // 快速跳到最近的行程
  const jumpToUpcoming = () => {
    if (upcomingDates.length === 0) {
      toast('目前沒有即將到來的行程', { icon: '📅' });
      return;
    }

    setPreviewMode('upcoming');
    setPreviewIndex(0);

    const nextEvent = upcomingDates[0];
    const displayDate = new Date(nextEvent.date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    toast.success(`最近的行程：${displayDate} - ${nextEvent.title}`, { duration: 4000 });
  };

  // 快速回顧過往行程
  const jumpToPast = () => {
    if (pastDates.length === 0) {
      toast('目前沒有過往行程', { icon: '📚' });
      return;
    }

    setPreviewMode('past');
    setPreviewIndex(0);

    const lastEvent = pastDates[0];
    const displayDate = new Date(lastEvent.date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    toast.success(`最近完成的行程：${displayDate} - ${lastEvent.title}`, { duration: 4000 });
  };

  // 批次操作函式
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDates.map(d => d.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('請先選擇要刪除的行程');
      return;
    }

    setIsDeleteDialogOpen(true);
  };

  // 資料載入完成後，若尚未登入就提示一次
  useEffect(() => {
    if (isLoaded && !auth.currentUser) {
      toast('歡迎！請先登入以儲存行程 🔒', { icon: '👋', duration: 5000 });
    }
  }, [isLoaded]);

  const handleOpenAdd = (presetDate?: string) => {
    // 沒登入就不開啟視窗，避免使用者填完才發現無法儲存
    if (!auth.currentUser) {
      toast.error("請先登入才能新增行程喔！");
      return;
    }
    setEditingDate(null);
    setSelectedDateForNew(presetDate || null);
    setIsModalOpen(true);
  };

  // 點擊月曆日期格子的新增按鈕時，開啟新增行程 Modal
  const handleCalendarAddClick = (date: Date) => {
    // 使用本地時區格式化日期，避免 UTC 時區問題
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    handleOpenAdd(dateString);
  };

  const handleOpenEdit = (dateItem: DateItem) => {
    setEditingDate(dateItem);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: Omit<DateItem, 'id'>): Promise<boolean> => {
    if (editingDate) return updateDate(editingDate.id, data);
    if (batchAddDates.length > 0) {
      const saved = await addDateToMultipleDates(batchAddDates, data);
      if (saved) setBatchAddDates([]);
      return saved;
    }
    return addDate({ ...data, id: '' });
  };
  // 拖曳複製行程處理
  const handleDuplicateDate = (sourceId: string, targetDate: string) => {
    duplicateDate(sourceId, targetDate);
  };

  // 批次新增請求處理
  const handleBatchAddRequest = (dates: Date[]) => {
    const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));
    setBatchAddDates(dateStrings);
    setIsModalOpen(true);
  };

  // 快速預覽目前要顯示的行程；篩選條件改變後索引可能超出範圍，此時不顯示
  const previewList = previewMode === 'upcoming' ? upcomingDates : pastDates;
  const currentPreview = previewMode ? previewList[previewIndex] : undefined;
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  return (
    <LoadingGate isLoaded={isLoaded} label="正在整理家庭行程...">
      <PageShell width="wide">
        <PageHeader title="家庭行程總覽" visuallyHidden />

        {/* 搜尋與篩選區 */}
        <div className="glass-card p-3 md:p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <SearchInput
              className="flex-1"
              aria-label="搜尋行程"
              placeholder="搜尋行程標題或描述..."
              value={searchTerm}
              onChange={setSearchTerm}
            />

            {/* 篩選與快速跳轉 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                aria-expanded={showFilters}
                aria-label="切換篩選器"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} aria-hidden="true" />
                篩選{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>

              <Button
                className="border-2 border-dashed border-[#5f7186]/30 bg-[#5f7186]/10 text-[#5f7186] hover:bg-[#5f7186]/20"
                onClick={jumpToUpcoming}
                aria-label="跳到最近行程"
              >
                <CalendarClock size={16} aria-hidden="true" />
                即將到來
              </Button>

              <Button
                className="border-2 border-dashed border-[#b87e6b]/50 bg-[#b87e6b]/20 text-[#b87e6b] hover:bg-[#b87e6b]/30"
                onClick={jumpToPast}
                aria-label="回顧過往行程"
              >
                <History size={16} aria-hidden="true" />
                回顧過往
              </Button>

              {hasAnyFilter && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>清除篩選</Button>
              )}

              {/* handleOpenAdd 內已含登入檢查 */}
              <Button variant="primary" className="lg:ml-2" onClick={() => handleOpenAdd()}>
                <Plus size={18} aria-hidden="true" /> 新增行程
              </Button>
            </div>
          </div>

          {/* 篩選選項：高度展開／收合，避免下方內容瞬間被推開 */}
          <AnimatePresence initial={false}>
            {showFilters && (
              <m.div variants={collapse} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                <div className="space-y-4 mt-3 pt-4 border-t border-dashed border-[#dcd0c2]/50">
                  {/* 分類多選 */}
                  <div>
                    <span className="text-xs font-bold text-[#3d3a36] mb-2 block">分類</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="篩選分類">
                      {categories.map((category: string) => (
                        <Chip
                          key={category}
                          selected={selectedCategories.includes(category)}
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* 日期區間 */}
                  <div>
                    <span className="text-xs font-bold text-[#3d3a36] mb-2 block">日期區間（需填寫起訖）</span>
                    <div className="flex gap-3 items-center">
                      <input
                        type="date"
                        value={dateRangeStart}
                        onChange={(e) => setDateRangeStart(e.target.value)}
                        className="modal-input flex-1"
                        aria-label="開始日期"
                      />
                      <span className="text-[#3d3a36]">至</span>
                      <input
                        type="date"
                        value={dateRangeEnd}
                        onChange={(e) => setDateRangeEnd(e.target.value)}
                        className="modal-input flex-1"
                        aria-label="結束日期"
                      />
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* 篩選結果提示 */}
          {hasAnyFilter && (
            <div className="mt-4 text-xs text-[#3d3a36]" aria-live="polite">
              找到 <span className="text-[#5f7186] font-bold">{filteredDates.length}</span> 個符合條件的行程
            </div>
          )}
        </div>

        {/* 快速預覽卡片 */}
        <AnimatePresence initial={false}>
          {previewMode && currentPreview && (() => {
            const previewDate = new Date(currentPreview.date);
            return (
              <m.div key="quick-preview" variants={popIn} initial="hidden" animate="visible" exit="exit" className="glass-card p-5 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={previewMode === 'upcoming'
                        ? 'px-2 py-1 rounded text-xs font-medium bg-[#5f7186]/10 text-[#5f7186]'
                        : 'px-2 py-1 rounded text-xs font-medium bg-[#b87e6b]/10 text-[#b87e6b]'}>
                        {previewMode === 'upcoming' ? '即將到來' : '回顧過往'}
                      </span>
                      {previewList.length > 1 && (
                        <span className="text-xs text-[#3d3a36]">
                          ({previewIndex + 1}/{previewList.length})
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#3d3a36] mb-1">
                      {previewDate.toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} {weekdays[previewDate.getDay()]}
                    </h3>
                  </div>
                  <IconButton aria-label="關閉預覽" onClick={closePreview}>
                    <X size={20} />
                  </IconButton>
                </div>

                {/* 下拉選單 - 選擇要查看的行程 */}
                {previewList.length > 1 && (
                  <div className="mb-4">
                    <label htmlFor="preview-select" className="text-xs text-[#3d3a36] mb-2 block">選擇行程</label>
                    <div className="relative">
                      <select
                        id="preview-select"
                        value={previewIndex}
                        onChange={(e) => setPreviewIndex(Number(e.target.value))}
                        className="modal-input appearance-none cursor-pointer pr-10"
                      >
                        {previewList.map((event, index) => {
                          const eventDate = new Date(event.date);
                          const formattedDate = eventDate.toLocaleDateString('zh-TW', {
                            month: 'numeric',
                            day: 'numeric'
                          });
                          return (
                            <option key={event.id} value={index} className="bg-[#f0ece1]">
                              {formattedDate} - {event.title} {event.startTime && `(${event.startTime})`}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d3a36] pointer-events-none" size={16} />
                    </div>
                  </div>
                )}

                {/* 當前行程詳情 */}
                <div className="mb-4">
                  <div className="flex items-start gap-3 p-4 bg-[#dcd0c2]/30 rounded-lg">
                    <div className="flex flex-col items-center justify-center min-w-[56px] h-14 bg-[#5f7186]/10 rounded-lg border-2 border-dashed border-[#5f7186]/30">
                      <span className="text-xs text-[#5f7186] leading-none mb-1">{previewDate.getMonth() + 1}月</span>
                      <span className="text-xl font-bold text-[#3d3a36] leading-none">{previewDate.getDate()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-[#3d3a36]">{currentPreview.title}</h4>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0 border border-dashed"
                          style={getCategoryColorStyles(currentPreview.category, categoryColors).badge}
                        >
                          {currentPreview.category}
                        </span>
                      </div>

                      {currentPreview.startTime && (
                        <p className="text-sm text-[#5f7186] font-medium mb-2">
                          {currentPreview.startTime}
                          {currentPreview.endTime && ` ~ ${currentPreview.endTime}`}
                        </p>
                      )}

                      {currentPreview.description && (
                        <p className="text-sm text-[#3d3a36] bg-[#dcd0c2]/30 p-2 rounded border-2 border-dashed border-[#dcd0c2]/50">
                          {currentPreview.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      closePreview();
                      // 滾動到月曆區域
                      document.getElementById('overview-calendar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    在月曆中查看
                  </Button>
                  <Button onClick={closePreview}>關閉</Button>
                </div>
              </m.div>
            );
          })()}
        </AnimatePresence>

        {/* 最近行程：單行精簡呈現，把垂直空間留給月曆 */}
        {upcomingDates.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-1 min-w-0">
            <span className="shrink-0 text-xs font-bold text-[#3d3a36] tracking-wider flex items-center gap-2">
              <span className="w-1 h-3 bg-[#5f7186] rounded-full"></span>
              最近行程
            </span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {upcomingDates.slice(0, 5).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="flex min-h-9 max-w-full items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0ece1] border border-dashed border-[#dcd0c2] hover:border-[#b87e6b] text-xs text-[#3d3a36] transition-colors duration-200"
                  title={item.title}
                >
                  <span className="font-bold text-[#b87e6b] tabular-nums">{new Date(item.date).getMonth() + 1}/{new Date(item.date).getDate()}</span>
                  <span className="min-w-0 truncate font-medium">{item.title}</span>
                  {item.startTime && <span className="shrink-0 text-[#5f7186] tabular-nums">{item.startTime}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 月曆預設即為完整寬度，並直接提供圖片匯出 */}
        <div id="overview-calendar" className="min-w-0 scroll-mt-24">
          <CalendarWidget
            events={filteredDates}
            onAddEvent={handleCalendarAddClick}
            onDelete={deleteDate}
            onEdit={handleOpenEdit}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            batchMode={batchMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectItem}
            onBatchModeToggle={() => {
              setBatchMode(!batchMode);
              setSelectedIds([]);
            }}
            onBatchDelete={handleBatchDelete}
            onSelectAll={toggleSelectAll}
            allSelected={selectedIds.length === filteredDates.length && filteredDates.length > 0}
            onDuplicateDate={handleDuplicateDate}
            onBatchAddRequest={handleBatchAddRequest}
            categoryColors={categoryColors}
          />
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <AddDateModal
              key={`${editingDate?.id ?? 'new'}-${selectedDateForNew ?? ''}`}
              isOpen
              onClose={() => {
                setIsModalOpen(false);
                setSelectedDateForNew(null);
                setBatchAddDates([]);
              }}
              onSubmit={handleModalSubmit}
              initialData={editingDate}
              presetDate={selectedDateForNew}
            />
          )}
        </AnimatePresence>

        <ConfirmDialog
          danger
          isOpen={isDeleteDialogOpen}
          title="刪除選取的行程？"
          description={`將刪除 ${selectedIds.length} 個行程，此操作可在完成後透過提示訊息復原。`}
          confirmLabel="刪除行程"
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            deleteDates(selectedIds);
            setSelectedIds([]);
            setBatchMode(false);
            setIsDeleteDialogOpen(false);
          }}
        />
      </PageShell>
    </LoadingGate>
  );
}
