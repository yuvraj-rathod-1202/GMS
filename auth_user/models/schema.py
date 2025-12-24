from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    email: EmailStr
    
class SignUpUser(BaseModel):
    email: EmailStr
    password: str
    
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    email: EmailStr
    
class ForgotPasswordRequest(BaseModel):
    email: EmailStr