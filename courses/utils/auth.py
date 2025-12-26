from fastapi import HTTPException, status
from utils.db import get_db

def verifyAdmin(email: str):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT email FROM admin WHERE email = %s",
        (email,)
    )
    admin = cursor.fetchone()
    if admin is None:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return True

def verifyInstructor(email: str, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM courses_role WHERE email = %s AND course_id = %s AND role = 'instructor'",
        (email, course_id)
    )
    instructor = cursor.fetchone()
    if instructor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
            )
    return True

def verifyInstructorOrTa(email: str, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM courses_role WHERE email = %s AND course_id = %s AND role IN ('instructor', 'ta')",
        (email, course_id)
    )
    role = cursor.fetchone()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
    return True