export interface CourseOverviewDBObject {
  id: number;
  course_id: number;
  mean: number;
  median: number;
  max: number;
  min: number;
  std: number;
  total_students: number;
  computed_at: Date;
  version: number;
}

export interface AssessmentAnalyticsDBObject {
  id: number;
  course_id: number;
  assessment_id: number;
  mean: number;
  median: number;
  max: number;
  min: number;
  std: number;
  total_students: number;
  computed_at: Date;
  version: number;
}

export interface AssessmentMarkFrequencyDBObject {
  id: number;
  course_id: number;
  assessment_id: number;
  mark: number;
  frequency: number;
  computed_at: Date;
}
