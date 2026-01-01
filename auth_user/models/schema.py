from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    email: EmailStr
    
class SignUpUser(BaseModel):
    id: int
    email: EmailStr
    password: str
    
class ChangePasswordRequest(BaseModel):
    id: int
    old_password: str
    new_password: str
    
class ForgotPasswordRequest(BaseModel):
    id: int