from datetime import datetime
from pydantic import BaseModel, EmailStr

class AssessmentsBDObj(BaseModel):
    id: int
    course_id: int
    name: str
    assessment_type: str
    max_marks: int
    is_marks_published: bool
    assessment_date: str
    created_by_email: EmailStr
    created_at: datetime
    updated_at: datetime