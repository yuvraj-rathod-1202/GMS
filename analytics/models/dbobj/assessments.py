from pydantic import BaseModel
import uuid
from datetime import datetime

class CourseOverviewBDObj(BaseModel):
    id: uuid.UUID
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
    id: uuid.UUID
    course_id: int
    assessment_id: int
    mean: float
    median: float
    max: float
    min: float
    std: float
    computed_at: datetime
    version: int
    
class AssessmentRangeBDObj(BaseModel):
    id: uuid.UUID
    course_id: int
    assessment_id: int
    range_start: float
    range_end: float
    student_count: int
    percentage: float
    computed_at: datetime
    version: int