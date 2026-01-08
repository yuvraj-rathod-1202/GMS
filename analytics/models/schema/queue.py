from pydantic import BaseModel
from typing import List, Optional

class ChangedMarks(BaseModel):
    student_id: int
    old_marks: Optional[float]
    new_marks: Optional[float]

class AssessmentQueueMessage(BaseModel):
    course_id: int
    assessment_id: Optional[int]
    changes: List[ChangedMarks]