'use client';

import { DateItem } from '@/types';
import { Trash2, Clock, Tag, Edit } from 'lucide-react';
import clsx from 'clsx';

interface DateCardProps {
  item: DateItem;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export default function DateCard({ item, onDelete, onEdit }: DateCardProps) {
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
    <div className="group relative flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
       {/* Bullet Point */}
       <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-pink-500"></div>

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
             <h3 className="text-white font-bold text-lg truncate tracking-wide">{item.title}</h3>
             
             {/* Tag - Urgent */}
             {isUrgent && (
               <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500 text-white animate-pulse">
                 緊急
               </span>
             )}
          </div>
          
          {/* ✨ 這裡使用了 flex-wrap，讓標籤在空間不夠時自動掉到下一行 */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            
            {/* 1. 日期與時間 (綁在一起，不換行) */}
            <span className="flex items-center gap-1.5 text-blue-200 font-medium text-sm bg-blue-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
              <Clock size={14} />
              {item.date} 
              {item.time && <span className="text-white border-l border-blue-400/30 pl-1.5 ml-0.5">{item.time}</span>}
            </span>

            {/* 2. 倒數天數 (獨立出來) */}
            <span className={clsx(
              "text-sm font-medium px-2 py-0.5 rounded-md whitespace-nowrap",
              isUrgent 
                ? "text-pink-300 bg-pink-500/10 border border-pink-500/20" 
                : "text-slate-400 bg-slate-700/30 border border-white/5"
            )}>
               {daysText}
            </span>

            {/* 3. 分類 */}
            <span className="flex items-center gap-1.5 text-purple-300 font-medium text-sm bg-purple-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
              <Tag size={14} />
              {item.category}
            </span>

          </div>

          {item.description && (
             <p className="text-slate-500 text-sm mt-2 line-clamp-2 border-l-2 border-slate-700 pl-2">
               {item.description}
             </p>
          )}
       </div>

       {/* Actions */}
       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
         <button 
           onClick={onEdit}
           className="p-2 text-gray-400 hover:text-blue-400 bg-[#161b2c] shadow-lg rounded-full border border-white/5 transition-colors"
           title="編輯"
         >
           <Edit size={14} />
         </button>

         <button 
           onClick={() => onDelete(item.id)}
           className="p-2 text-gray-400 hover:text-red-400 bg-[#161b2c] shadow-lg rounded-full border border-white/5 transition-colors"
           title="刪除"
         >
           <Trash2 size={14} />
         </button>
       </div>
    </div>
  );
}