from pydantic import BaseModel

class EnrollStudentRequest(BaseModel):
    email: str
    student_email: str
    
class EnrollTaRequest(BaseModel):
    email: str
    ta_email: str
    
class EnrollInstructorRequest(BaseModel):
    email: str
    instructor_email: str