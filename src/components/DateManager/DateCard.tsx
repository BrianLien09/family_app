import { DateItem } from '@/types';
import { Trash2, Clock, Tag } from 'lucide-react';
import clsx from 'clsx';

interface DateCardProps {
  item: DateItem;
  onDelete: (id: string) => void;
}

export default function DateCard({ item, onDelete }: DateCardProps) {
  const dateObj = new Date(item.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Is urgent? (Within 3 days)
  const isUrgent = diffDays >= 0 && diffDays <= 3;

  return (
    <div className="group relative flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
       {/* Bullet Point */}
       <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-pink-500"></div>

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
             <h3 className="text-white font-bold text-lg truncate tracking-wide">{item.title}</h3>
             
             {/* Tag - matching the "緊急" tag in image */}
             {isUrgent && (
               <span className="shrink-0 px-2 py-0.5 rounded textxs font-bold bg-pink-500 text-white animate-pulse">
                 緊急
               </span>
             )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1.5 text-blue-200 font-medium text-sm bg-blue-500/10 px-2 py-0.5 rounded-md">
              <Clock size={14} />
              {item.date} {item.time && <span className="text-white border-l border-blue-400/30 pl-1.5 ml-0.5">{item.time}</span>}
            </span>
            <span className="flex items-center gap-1.5 text-purple-300 font-medium text-sm bg-purple-500/10 px-2 py-0.5 rounded-md">
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

       <button 
         onClick={() => onDelete(item.id)}
         className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-[#161b2c] shadow-lg rounded-full"
       >
         <Trash2 size={14} />
       </button>
    </div>
  );
}
