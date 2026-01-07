import { DateItem } from '@/types';
import { Trash2 } from 'lucide-react';
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
    <div className="group relative flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
       {/* Bullet Point */}
       <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-pink-500"></div>

       <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
             <h3 className="text-gray-200 font-medium truncate">{item.title}</h3>
             
             {/* Tag - matching the "緊急" tag in image */}
             {isUrgent && (
               <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-pink-500">
                 緊急
               </span>
             )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5 font-mono">
            {item.date} <span className="opacity-50 mx-1">|</span> {item.category}
          </p>
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
