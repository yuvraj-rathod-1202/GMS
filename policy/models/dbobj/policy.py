from pydantic import BaseModel
from typing import List, Dict

class GradingRuleDBObj(BaseModel):
    id: int
    rule_type: str
    rule_params: Dict
    priority: int

class GradingComponentDBObj(BaseModel):
    id: int
    assessment_category_id: int
    weightage: float
    created_at: str
    updated_at: str
    rules: List[GradingRuleDBObj]

class PolicyDBObj(BaseModel):
    id: int
    course_id: int
    total_weightage: float
    set_by_id: int
    set_at: str
    updated_at: str
    components: List[GradingComponentDBObj]