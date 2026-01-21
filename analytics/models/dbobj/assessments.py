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