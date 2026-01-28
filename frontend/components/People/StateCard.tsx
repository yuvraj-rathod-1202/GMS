export function StatCard({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border cursor-pointer transition-all ${
        isActive
          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
    </div>
  );
}
