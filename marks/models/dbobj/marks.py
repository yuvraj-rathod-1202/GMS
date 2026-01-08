from pydantic import BaseModel
from datetime import datetime

class MarksDBObj(BaseModel):
    student_id: int
    marks_obtained: float
    recorded_by_id: int
    updated_at: datetime
    
class AllMarksDBObj(BaseModel):
    assessment_id: int
    marks_obtained: float
    recorded_by_id: int
    updated_at: datetime
    assessment_name: str
    assessment_type_id: int
    max_marks: float
    assessment_date: datetime