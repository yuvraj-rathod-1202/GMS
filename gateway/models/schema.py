from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, List, Optional

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
    
class CreateAssessmentRequest(BaseModel):
    name: str
    assessment_type_id: int
    max_marks: int
    is_marks_published: bool
    assessment_date: datetime
    
class UpdateAssessmentRequest(BaseModel):
    name: Optional[str] = None
    assessment_type_id: Optional[int] = None
    max_marks: Optional[int] = None
    is_marks_published: Optional[bool] = None
    assessment_date: Optional[datetime] = None
    
    class Config:
        extra = "forbid"
        
class StudentMark(BaseModel):
    student_id: int
    marks_obtained: float
class AddMarksRequest(BaseModel):
    marks: List[StudentMark]
    
class GradingRuleRequest(BaseModel):
    rule_type: str
    rule_params: Dict

class GradingComponentRequest(BaseModel):
    assessment_category_id: int
    weightage: float
    rules: GradingRuleRequest | None

class CreatePolicyRequest(BaseModel):
    policy_name: str = Field(..., max_length=100)
    total_weightage: float
    components: List[GradingComponentRequest]
    
class UpdatePolicyRequest(BaseModel):
    id: int
    policy_name: Optional[str] = Field(None, max_length=100)
    total_weightage: Optional[float] = None
    
class UpdateGradingRuleRequest(BaseModel):
    id: Optional[int]
    rule_type: str
    rule_params: Dict
    
class UpdatePolicyComponentRequest(BaseModel):
    assessment_category_id: int
    weightage: float
    rules: UpdateGradingRuleRequest | None
    
class StudentPolicyMapping(BaseModel):
    student_id: int
    policy_id: int
class AssignPolicyRequest(BaseModel):
    mapping: List[StudentPolicyMapping]