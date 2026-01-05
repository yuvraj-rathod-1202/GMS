from pydantic import BaseModel
from typing import List, Dict, Optional

class GradingRuleRequest(BaseModel):
    rule_type: str
    rule_params: Dict
    priority: int

class GradingComponentRequest(BaseModel):
    assessment_category_id: int
    weightage: float
    rules: List[GradingRuleRequest]

class CreatePolicyRequest(BaseModel):
    total_weightage: float
    set_by_id: int
    components: List[GradingComponentRequest]
    
class UpdatePolicyRequest(BaseModel):
    id: int
    total_weightage: float
    updated_by_id: int
    
class UpdateGradingRuleRequest(BaseModel):
    id: Optional[int]
    rule_type: str
    rule_params: Dict
    priority: int
    
class UpdatePolicyComponentRequest(BaseModel):
    updated_by_id: int
    assessment_category_id: int
    weightage: float
    rules: List[UpdateGradingRuleRequest]