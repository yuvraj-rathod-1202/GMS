from pydantic import BaseModel
from datetime import datetime

class CoursesDBObject(BaseModel):
    id: int
    course_code: str
    name: str
    semester: str
    credits: int
    status: str
    total_students: int
    created_at: datetime
    updated_at: datetime