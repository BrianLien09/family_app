import clsx from 'clsx';
import { FamilyMember, FAMILY_MEMBERS, MEMBER_COLORS } from '@/types';

interface MemberFilterProps {
  selectedMember: FamilyMember | '全體';
  onChange: (member: FamilyMember | '全體') => void;
}

export default function MemberFilter({ selectedMember, onChange }: MemberFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onChange('全體')}
        className={clsx(
          "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
          selectedMember === '全體'
            ? "bg-white/20 text-white border-white/30 shadow-lg"
            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
        )}
      >
        全體
      </button>
      {FAMILY_MEMBERS.map(member => (
        <button
          key={member}
          onClick={() => onChange(member)}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2",
            selectedMember === member
              ? "text-white shadow-lg"
              : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
          )}
          style={{
            backgroundColor: selectedMember === member ? MEMBER_COLORS[member] : undefined,
            borderColor: selectedMember === member ? MEMBER_COLORS[member] : undefined,
          }}
        >
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: selectedMember === member ? '#fff' : MEMBER_COLORS[member] }}
          />
          {member}
        </button>
      ))}
    </div>
  );
}
