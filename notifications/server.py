from fastapi import FastAPI, HTTPException, status
from utils.db import get_db
from models.dbobj.notification import NotificationBDObj

app = FastAPI()

@app.get("/user/{user_id}")
def get_user_notifications(user_id: int):
    db = get_db()
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT id, event, subject, message, status, sent_at FROM notification_logs WHERE user_id = %s AND type = 'IN_APP' ORDER BY sent_at DESC",
            (user_id,)
        )
        
        notifications = cursor.fetchall()
        db.commit()
        result = [
            NotificationBDObj(
                id=row[0],
                user_id=user_id,
                event=row[1],
                subject=row[2],
                body=row[3],
                status=row[4],
                sent_at=row[5]
            )
            for row in notifications
        ]
        
        return {"notifications": result}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
