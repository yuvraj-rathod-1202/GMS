from pydantic import BaseModel
from typing import List

class StudentMark(BaseModel):
    student_id: int
    marks_obtained: float

class AddMarksRequest(BaseModel):
    recorded_by_id: int
    marks: List[StudentMark]