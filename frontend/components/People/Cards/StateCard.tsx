'use client';

export function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{count.toLocaleString()}</p>
    </div>
  );
}
