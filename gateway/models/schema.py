from pydantic import BaseModel, EmailStr

class SignUpUser(BaseModel):
    username: str | None = None
    email: EmailStr
    password: str