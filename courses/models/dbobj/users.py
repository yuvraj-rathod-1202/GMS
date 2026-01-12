from datetime import datetime
from pydantic import BaseModel

class CourseDBObject(BaseModel):
    id: int
    course_code: str
    name: str
    semester: str
    credits: int
    status: str
    total_students: int
    created_at: datetime
    role: str