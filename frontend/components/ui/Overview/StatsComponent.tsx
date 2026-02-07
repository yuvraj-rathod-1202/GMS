export default function StatsComponent({
  stat,
}: {
  stat: { label: string; value: string | number };
}) {
  return (
    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="w-full">
        <p className="text-xs font-medium text-gray-500 tracking-wide mb-1">{stat.label}</p>
        <p className="text-xs lg:text-base font-semibold text-gray-900 wrap-break-words">
          {stat.value}
        </p>
      </div>
    </div>
  );
}
