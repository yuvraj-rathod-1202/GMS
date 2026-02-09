export interface GradeSheetColumn<T = any> {
  header: string | React.ReactNode;
  key: keyof T | string;
  width?: string;
  editable?: boolean;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  onEdit?: (value: any, row: T, rowIndex: number) => void | Promise<void>;
  onEditComplete?: (newValue: any, oldValue: any, row: T, rowIndex: number) => void | Promise<void>;
}

export interface GradeSheetProps<T = any> {
  columns: GradeSheetColumn<T>[];
  data: T[];
  max_marks?: number;
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, rowIndex: number) => void;
  changedCells?: Set<string>; // Format: "studentId-columnKey"
}

export interface IGradeSheetColumn<T = any> {
  header: string | React.ReactNode;
  key: keyof T | string;
  width?: string;
  editable?: boolean;
  max_marks?: number;
  headerActions?: React.ReactNode;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  onEdit?: (value: any, row: T, rowIndex: number) => void | Promise<void>;
  onEditComplete?: (newValue: any, oldValue: any, row: T, rowIndex: number) => void | Promise<void>;
}

export interface IGradeSheetProps<T = any> {
  columns: IGradeSheetColumn<T>[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, rowIndex: number) => void;
  changedCells?: Set<string>; // Format: "studentId-columnKey"
}
