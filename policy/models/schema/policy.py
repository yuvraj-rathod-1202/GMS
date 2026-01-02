from pydantic import BaseModel
from typing import List, Dict

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