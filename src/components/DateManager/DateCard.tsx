'use client';

import { DateItem } from '@/types';
import { Trash2, Clock, Tag, Edit, Check } from 'lucide-react';
import clsx from 'clsx';

interface DateCardProps {
  item: DateItem;
  onDelete: (id: string) => void;
  onEdit: () => void;
  batchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function DateCard({ item, onDelete, onEdit, batchMode = false, isSelected = false, onToggleSelect }: DateCardProps) {
  const dateObj = new Date(item.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Is urgent? (Within 3 days)
  const isUrgent = diffDays >= 0 && diffDays <= 3;

  let daysText = '';
  if (diffDays < 0) daysText = '已結束';
  else if (diffDays === 0) daysText = '今天';
  else if (diffDays === 1) daysText = '明天';
  else daysText = `${diffDays} 天後`;

  return (
    <div 
      className={clsx(
        // will-change-transform：預先告知瀏覽器此元素會有 transform 動畫（hover 浮起效果）
        // 讓瀏覽器提前分配 GPU layer，消除 hover 瞬間的輕微頓感
        "group relative flex items-start gap-4 p-3 rounded-lg border-2 border-dashed backdrop-blur-sm transition-all duration-300 will-change-transform",
        batchMode ? "cursor-pointer" : "",
        isSelected 
          ? "bg-[#5f7186]/10 border-[#5f7186]/50 shadow-[0_8px_20px_rgba(139,121,101,0.08)] shadow-purple-500/20" 
          : "bg-[#dcd0c2]/30 border-dashed border-[#dcd0c2]/50 hover:bg-[#dcd0c2]/50 hover:border-dashed border-[#dcd0c2]/50 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(139,121,101,0.08)]"
      )}
      onClick={() => batchMode && onToggleSelect && onToggleSelect(item.id)}
    >
       {/* Batch Mode Checkbox */}
       {batchMode && (
         <div 
           className={clsx(
             "mt-1.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
             isSelected 
               ? "bg-[#5f7186] border-[#5f7186]/50" 
               : "border-slate-500 bg-[#dcd0c2]/30"
           )}
         >
           {isSelected && <Check size={14} className="text-[#78716c]" />}
         </div>
       )}
       
       {/* Bullet Point (only when not in batch mode) */}
       {!batchMode && (
         <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-pink-500"></div>
       )}

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
             <h3 className="text-[#3d3a36] font-bold text-lg truncate tracking-wide">{item.title}</h3>
             
             {/* Tag - Urgent */}
             {isUrgent && (
               <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-[#b87e6b] text-[#f0ece1] animate-pulse">
                 緊急
               </span>
             )}
          </div>
          
           {/* ✨ 這裡使用了 flex-wrap，讓標籤在空間不夠時自動掉到下一行 */}
           <div className="flex flex-wrap items-center gap-2 mt-1.5">
             
             {/* 1. 日期與時間區段 (綁在一起，不換行) */}
             <span className="flex items-center gap-1.5 text-[#5f7186] font-medium text-sm bg-[#5f7186]/10 px-2 py-0.5 rounded-md whitespace-nowrap">
               <Clock size={14} />
               {item.date} 
               {item.startTime && (
                 <span className="text-[#5f7186] border-l border-[#5f7186]/30 pl-1.5 ml-0.5">
                   {item.startTime}
                   {item.endTime && ` ~ ${item.endTime}`}
                 </span>
               )}
             </span>

             {/* 2. 倒數天數 (獨立出來) */}
             <span className={clsx(
               "text-sm font-medium px-2 py-0.5 rounded-md whitespace-nowrap",
               isUrgent 
                 ? "text-[#b87e6b] bg-[#b87e6b]/10 border-2 border-dashed border-[#b87e6b]/20" 
                 : "text-[#3d3a36] bg-[#dcd0c2]/30 border-2 border-dashed border-dashed border-[#dcd0c2]/50"
             )}>
                {daysText}
             </span>

             {/* 3. 分類 */}
             <span className="flex items-center gap-1.5 text-[#5f7186] font-medium text-sm bg-[#5f7186]/10 px-2 py-0.5 rounded-md whitespace-nowrap">
               <Tag size={14} />
               {item.category}
             </span>

           </div>

          {item.description && (
             <p className="text-[#3d3a36] text-sm mt-2 line-clamp-2 border-l-2 border-[#dcd0c2] pl-2">
               {item.description}
             </p>
          )}
       </div>

       {/* Actions */}
       {!batchMode && (
         <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
           <button 
             onClick={onEdit}
             className="p-2 text-[#3d3a36] hover:text-[#5f7186] bg-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] rounded-full border-2 border-dashed border-dashed border-[#dcd0c2]/50 transition-all duration-200"
             title="編輯"
           >
             <Edit size={14} />
           </button>

           <button 
             onClick={() => onDelete(item.id)}
             className="p-2 text-[#3d3a36] hover:text-[#b87e6b] bg-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)] rounded-full border-2 border-dashed border-dashed border-[#dcd0c2]/50 transition-all duration-200"
             title="刪除"
           >
             <Trash2 size={14} />
           </button>
         </div>
       )}
    </div>
  );
}