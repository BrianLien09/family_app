'use client';

import { FamilyMember, FAMILY_MEMBERS, MEMBER_COLORS } from '@/types';
import Chip from '@/components/ui/Chip';

interface MemberFilterProps {
  selectedMember: FamilyMember | '全體';
  onChange: (member: FamilyMember | '全體') => void;
}

export default function MemberFilter({ selectedMember, onChange }: MemberFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="篩選成員">
      <Chip selected={selectedMember === '全體'} onClick={() => onChange('全體')}>
        全體
      </Chip>
      {FAMILY_MEMBERS.map(member => {
        const isSelected = selectedMember === member;
        return (
          <Chip
            key={member}
            selected={isSelected}
            onClick={() => onChange(member)}
            // 選取時改用成員代表色，讓使用者一眼知道目前在看誰的帳
            style={isSelected ? { backgroundColor: MEMBER_COLORS[member], borderColor: MEMBER_COLORS[member] } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: isSelected ? '#f0ece1' : MEMBER_COLORS[member] }}
            />
            {member}
          </Chip>
        );
      })}
    </div>
  );
}
