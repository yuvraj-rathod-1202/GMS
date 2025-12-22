from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    username: str | None = None
    email: EmailStr
    
class SignUpUser(BaseModel):
    username: str | None = None
    email: EmailStr
    password: str