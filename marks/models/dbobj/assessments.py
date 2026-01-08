from datetime import datetime
from pydantic import BaseModel

class AssessmentsBDObj(BaseModel):
    id: int
    course_id: int
    name: str
    assessment_type_id: int
    max_marks: int
    is_marks_published: bool
    assessment_date: datetime
    created_by_id: int
    created_at: datetime
    updated_at: datetime