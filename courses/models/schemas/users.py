from pydantic import BaseModel

class GetCourseRoleRequest(BaseModel):
    user_email: str
    
class GetAllCourseRoleRequest(BaseModel):
    user_email: str
    status: str | None = None