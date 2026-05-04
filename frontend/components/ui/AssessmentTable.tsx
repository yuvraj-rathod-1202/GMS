import DataTable, { DataTableColumn } from './DataTable';
import { AssessmentTableProps } from '@/lib/types/ui/studentassessmenttable';

export default function AssessmentTable({
  columns,
  data,
  emptyMessage = 'No data available',
}: AssessmentTableProps) {
  const tableColumns: DataTableColumn<Record<string, unknown>>[] = columns.map((column) => ({
    key: column.key,
    header: column.header,
    render: column.render ? (value, row) => column.render?.(value, row) : undefined,
  }));

  return (
    <DataTable
      columns={tableColumns}
      data={data}
      emptyMessage={emptyMessage}
      className="shadow-none"
    />
  );
}
