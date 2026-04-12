from pydantic import BaseModel
from datetime import datetime

class CourseOverviewBDObj(BaseModel):
    id: int
    course_id: int
    mean: float
    median: float
    max: float
    min: float
    std: float
    total_students: int
    computed_at: datetime
    version: int
    
class AssessmentAnalyticsBDObj(BaseModel):
    id: int
    course_id: int
    assessment_id: int
    mean: float
    median: float
    max: float
    min: float
    std: float
    total_students: int
    computed_at: datetime
    version: int
    
class AssessmentMarkFrequencyBDObj(BaseModel):
    id: int
    course_id: int
    assessment_id: int
    mark: float
    frequency: int
    computed_at: datetime

class SystemOverviewBDObj(BaseModel):
    total_courses: int
    active_courses: int
    inactive_courses: int
    total_students: int
    total_instructors: int
    total_assessments: int
    average_student_grade: float
    computed_at: datetime