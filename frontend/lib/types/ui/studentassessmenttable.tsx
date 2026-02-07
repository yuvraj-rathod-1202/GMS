export interface AssessmentTableColumn {
  header: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface AssessmentTableProps {
  columns: AssessmentTableColumn[];
  data: any[];
  emptyMessage?: string;
}
