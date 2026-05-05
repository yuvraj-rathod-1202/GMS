from pydantic import BaseModel, ConfigDict
from typing import Optional

    
class AddCourseRequest(BaseModel):
    user_id: int
    course_code: str
    name: str
    semester: str
    credits: int
    
class UpdateCourseStatusRequest(BaseModel):
    user_id: int
    status: Optional[str] = None
    course_code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[int] = None
    
    model_config = ConfigDict(extra = "forbid")
