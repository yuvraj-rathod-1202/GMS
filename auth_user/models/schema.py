from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    email: EmailStr
    
class SignUpUser(BaseModel):
    email: EmailStr
    password: str