export interface CreateAssessmentRequest {
  name: string;
  assessment_type_id: number;
  max_marks: number;
  is_marks_published: boolean;
  assessment_date: Date;
}

export interface AssessmentDBObject {
  id: number;
  course_id: number;
  name: string;
  assessment_type_id: number;
  max_marks: number;
  is_marks_published: boolean;
  assessment_date: Date;
  created_by_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateAssessmentRequest {
  name?: string;
  assessment_type_id?: number;
  max_marks?: number;
  is_marks_published?: boolean;
  assessment_date?: Date;
}
