from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime

class GradingRuleDBObj(BaseModel):
    id: int
    rule_type: str
    rule_params: Dict

class GradingComponentDBObj(BaseModel):
    id: int
    assessment_category_id: int
    weightage: float
    created_at: datetime
    updated_at: datetime
    rules: GradingRuleDBObj | None

class PolicyDBObj(BaseModel):
    id: int
    course_id: int
    total_weightage: float
    policy_name: str = Field(..., max_length=100)
    set_by_id: int
    updated_by_id: int
    set_at: datetime
    updated_at: datetime
    components: List[GradingComponentDBObj]
    
class TotalScoreDBObj(BaseModel):
    id: int
    student_id: int
    total_marks: float
    final_grade: str | None
    computed_at: datetime
    updated_at: datetime