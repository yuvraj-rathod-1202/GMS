from pydantic import BaseModel
from typing import Optional

class EnrollStudentRequest(BaseModel):
    user_id: int
    student_id: int
    email: Optional[str] = None
    
class EnrollTaRequest(BaseModel):
    user_id: int
    ta_id: int
    email: Optional[str] = None
    
class EnrollInstructorRequest(BaseModel):
    user_id: int
    instructor_id: int
    email: Optional[str] = None

class StudentEnrollment(BaseModel):
    student_id: int
    email: Optional[str] = None    

class BulkEnrollStudentRequest(BaseModel):
    user_id: int
    students: list[StudentEnrollment]