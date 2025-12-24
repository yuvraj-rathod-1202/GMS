from pydantic import BaseModel, EmailStr

class SignUpUser(BaseModel):
    email: EmailStr
    password: str