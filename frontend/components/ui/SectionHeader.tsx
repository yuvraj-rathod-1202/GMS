import React from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

export function SectionHeader({
  title,
  expanded,
  onToggle,
  icon,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gms-indigoLight transition"
    >
      <div className="flex items-center gap-2 text-xs text-gms-black">
        <span className="text-gray-500">{expanded ? <FaChevronDown /> : <FaChevronRight />}</span>
      </div>
      <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
        {icon}
        {title}
      </span>
    </button>
  );
}
