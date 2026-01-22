interface AssessmentTableColumn {
  header: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AssessmentTableProps {
  columns: AssessmentTableColumn[];
  data: any[];
  emptyMessage?: string;
}

export default function AssessmentTable({
  columns,
  data,
  emptyMessage = 'No data available',
}: AssessmentTableProps) {
  return (
    <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white">
      {/* Table Header */}
      <div
        className="grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base bg-gray-50 border-b border-gray-300"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((column, index) => (
          <div key={index} className="font-semibold text-gray-900 text-left">
            {column.header}
          </div>
        ))}
      </div>

      {/* Table Body */}
      {data.length === 0 ? (
        <div className="px-6 py-8 text-xs sm:text-sm md:text-base text-center text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-4 px-6 py-4 text-xs sm:text-sm md:text-base items-center ${
              rowIndex !== data.length - 1 ? 'border-b border-gray-200' : ''
            }`}
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="text-gray-700">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
