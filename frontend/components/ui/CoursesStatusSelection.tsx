import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function CoursesStatusSelection({
  setOpen,
  open,
  statusFilter,
  setStatusFilter,
}: {
  setOpen: (open: boolean) => void;
  open: boolean;
  statusFilter: 'ongoing' | 'completed';
  setStatusFilter: (status: 'ongoing' | 'completed') => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="min-w-35 flex items-center justify-between gap-2 px-3 py-1.5 text-sm bg-white text-gms-black rounded-md hover:border-gms-gray"
      >
        {statusFilter === 'ongoing' ? 'ongoing' : 'completed'}
        <FaChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-full bg-white rounded-md shadow-lg z-20">
          {['ongoing', 'completed'].map((v) => (
            <button
              key={v}
              onClick={() => {
                setStatusFilter(v as 'ongoing' | 'completed');
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gms-grayLight/40`}
            >
              {v === 'ongoing' ? 'ongoing' : 'completed'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
