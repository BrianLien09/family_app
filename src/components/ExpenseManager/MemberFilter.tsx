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
          selectedMember === '全體' ? "bg-[#5f7186] text-[#f0ece1] border-[#5f7186] shadow-[0_8px_20px_rgba(139,121,101,0.08)]"
            : "bg-[#dcd0c2]/30 text-[#3d3a36] border-dashed border-[#dcd0c2]/50 hover:bg-[#dcd0c2]/50"
        )}
      >
        全體
      </button>
      {FAMILY_MEMBERS.map(member => (
        <button
          key={member}
          onClick={() => onChange(member)}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 border-dashed flex items-center gap-2",
            selectedMember === member
              ? "text-[#f0ece1] shadow-[0_8px_20px_rgba(139,121,101,0.08)]"
              : "bg-[#dcd0c2]/30 text-[#3d3a36] border-dashed border-[#dcd0c2]/50 hover:bg-[#dcd0c2]/50"
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
