export interface StudentData {
  index: number;
  id: string;
  email: string;
}

export interface StudentListProps {
  students: StudentData[];
  onRemoveStudent: (studentId: number) => Promise<void>;
  isLoading?: boolean;
}
