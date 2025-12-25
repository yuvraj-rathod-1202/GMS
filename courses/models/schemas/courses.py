from pydantic import BaseModel, EmailStr
from typing import Optional

class GetAllCourseRequest(BaseModel):
    email: EmailStr
    
class AddCourseRequest(BaseModel):
    email: EmailStr
    course_code: str
    name: str
    semester: str
    credits: int
    
class UpdateCourseStatusRequest(BaseModel):
    email: EmailStr
    status: Optional[str]
    course_code: Optional[str]
    name: Optional[str]
    credits: Optional[int]
    
class DeleteCourseRequest(BaseModel):
    email: EmailStr
    
class GetAllRolesRequest(BaseModel):
    email: EmailStr