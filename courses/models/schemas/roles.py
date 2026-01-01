from pydantic import BaseModel

class EnrollStudentRequest(BaseModel):
    user_id: int
    student_id: int
    
class EnrollTaRequest(BaseModel):
    user_id: int
    ta_id: int
    
class EnrollInstructorRequest(BaseModel):
    user_id: int
    instructor_id: int