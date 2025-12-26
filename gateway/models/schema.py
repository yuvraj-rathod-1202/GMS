from pydantic import BaseModel, EmailStr
from typing import Optional

class SignUpUser(BaseModel):
    email: EmailStr
    password: str
    
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    email: EmailStr
    
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    
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
    student_email: EmailStr
    
class EnrollTaRequest(BaseModel):
    ta_email: EmailStr
    
class EnrollInstructorRequest(BaseModel):
    instructor_email: EmailStr
    
class GetAllCourseRoleRequest(BaseModel):
    course_status: Optional[str] = None