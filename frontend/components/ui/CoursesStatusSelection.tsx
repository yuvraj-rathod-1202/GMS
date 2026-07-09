import React from 'react';

export default function CoursesStatusSelection({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: 'ongoing' | 'completed' | 'all';
  setStatusFilter: (status: 'ongoing' | 'completed' | 'all') => void;
}) {
  const options = [
    { id: 'all', label: 'All' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => setStatusFilter(option.id as any)}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            statusFilter === option.id
              ? 'bg-white text-gms-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
