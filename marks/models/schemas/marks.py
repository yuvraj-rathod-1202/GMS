from pydantic import BaseModel, EmailStr
from typing import List

class StudentMark(BaseModel):
    student_email: EmailStr
    marks_obtained: float

class AddMarksRequest(BaseModel):
    recorded_by_email: EmailStr
    marks: List[StudentMark]