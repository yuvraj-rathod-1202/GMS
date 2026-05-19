from pydantic import BaseModel, Field
from typing import List, Dict, Optional

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
    set_by_id: int
    components: List[GradingComponentRequest]
    
class UpdatePolicyRequest(BaseModel):
    id: int
    policy_name: Optional[str] = Field(None, max_length=100)
    total_weightage: Optional[float] = None
    updated_by_id: int
    
class UpdateGradingRuleRequest(BaseModel):
    id: Optional[int]
    rule_type: str
    rule_params: Dict
    
class UpdatePolicyComponentRequest(BaseModel):
    updated_by_id: int
    assessment_category_id: int
    weightage: float
    rules: UpdateGradingRuleRequest | None
    
class CreatePolicyComponentRequest(BaseModel):
    added_by_id: int
    assessment_category_id: int
    weightage: float
    rules: GradingRuleRequest | None
    
class StuentPolicyMapping(BaseModel):
    student_id: int
    course_policy_id: int
class AssignPolicyRequest(BaseModel):
    assigned_by_id: int
    mapping: List[StuentPolicyMapping]

class CreateCategoryRequest(BaseModel):
    type: str = Field(..., max_length=50)
    user_id: int