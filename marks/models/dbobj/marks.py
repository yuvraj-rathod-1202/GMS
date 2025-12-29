from pydantic import BaseModel, EmailStr
from datetime import datetime

class MarksDBObj(BaseModel):
    student_email: EmailStr
    marks_obtained: float
    recorded_by_email: EmailStr
    updated_at: datetime
    
class AllMarksDBObj(BaseModel):
    assessment_id: int
    marks_obtained: float
    recorded_by_email: EmailStr
    updated_at: datetime
    assessment_name: str
    assessment_type: str
    max_marks: float
    assessment_date: datetime