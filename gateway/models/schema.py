from pydantic import BaseModel, EmailStr
from typing import Optional

class SignUpUser(BaseModel):
    id: int
    email: EmailStr
    password: str
    
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    id: int
    
class ForgotPasswordRequest(BaseModel):
    id: int
    
class AddCourseRequest(BaseModel):
    course_code: str
    name: str
    semester: str
    credits: int
    
class UpdateCourseStatusRequest(BaseModel):
    status: Optional[str] = None
    course_code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[int] = None
    
    class Config:
        extra = "forbid"
    
class EnrollStudentRequest(BaseModel):
    student_id: int
    
class EnrollTaRequest(BaseModel):
    ta_id: int
    
class EnrollInstructorRequest(BaseModel):
    instructor_id: int
    
class GetAllCourseRoleRequest(BaseModel):
    course_status: Optional[str] = None