from pydantic import BaseModel
from typing import List
from datetime import datetime

class ChangeItem(BaseModel):
    student_id: int

class ComputeQueueMessage(BaseModel):
    course_id: int
    changes: List[ChangeItem]
    
class AllMarksDBObj(BaseModel):
    assessment_id: int
    marks_obtained: float
    recorded_by_id: int
    updated_at: datetime
    assessment_name: str
    assessment_type_id: int
    max_marks: float
    assessment_date: datetime