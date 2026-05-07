from utils.db import get_db
from fastapi import HTTPException, status

def add_admin(user_id: int):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        cursor = db.cursor()
        cursor.execute("INSERT IGNORE INTO admin (user_id) VALUES (%s)", (user_id,))
        db.commit()
        return {"message": f"User {user_id} promoted to admin"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to promote user: {str(e)}")

def remove_admin(user_id: int):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        cursor = db.cursor()
        cursor.execute("DELETE FROM admin WHERE user_id = %s", (user_id,))
        db.commit()
        return {"message": f"User {user_id} demoted from admin"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to demote user: {str(e)}")

def get_all_admins():
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        cursor = db.cursor()
        cursor.execute("SELECT user_id FROM admin")
        rows = cursor.fetchall()
        return {"admins": [row[0] for row in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch admins: {str(e)}")
