from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class CreateAssessmentRequest(BaseModel):
    email: EmailStr
    name: str
    assessment_type: str
    max_marks: int
    is_marks_published: bool
    assessment_date: datetime
    
class UpdateAssessmentRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    assessment_type: Optional[str] = None
    max_marks: Optional[int] = None
    is_marks_published: Optional[bool] = None
    assessment_date: Optional[datetime] = None