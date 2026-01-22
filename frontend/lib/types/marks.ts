export interface StudentMark {
  student_id: number;
  marks_obtained: number;
}

export interface AddMarksRequest {
  marks: StudentMark[];
}

export interface MarksDBObject {
  student_id: number;
  marks_obtained: number;
  recorded_by_id: number;
  updated_at: Date;
}
