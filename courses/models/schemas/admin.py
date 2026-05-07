from pydantic import BaseModel

class AdminRequest(BaseModel):
    user_id: int