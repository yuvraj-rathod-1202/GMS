from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CreateAssessmentRequest(BaseModel):
    user_id: int
    name: str
    assessment_type_id: int
    max_marks: float
    is_marks_published: bool
    assessment_date: datetime
    
class UpdateAssessmentRequest(BaseModel):
    user_id: int
    name: Optional[str] = None
    assessment_type_id: Optional[int] = None
    max_marks: Optional[float] = None
    is_marks_published: Optional[bool] = None
    assessment_date: Optional[datetime] = None