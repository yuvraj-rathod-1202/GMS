from pydantic import BaseModel
from datetime import datetime

class NotificationBDObj(BaseModel):
    id: int
    user_id: int
    event: str
    subject: str
    body: str
    status: str
    sent_at: datetime