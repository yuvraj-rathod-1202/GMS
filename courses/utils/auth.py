from fastapi import HTTPException, status
from utils.db import get_db

def isAdmin(user_id: int) -> bool:
    db = get_db()
    if db is None: return False
    cursor = db.cursor()
    cursor.execute("SELECT id FROM admin WHERE user_id = %s", (user_id,))
    return cursor.fetchone() is not None

def verifyAdmin(user_id: int):
    if isAdmin(user_id): return True
    raise HTTPException(status_code=403, detail="Admin privileges required")

def verifyInstructor(user_id: int, course_id: int):
    if isAdmin(user_id): return True
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM courses_role WHERE user_id = %s AND course_id = %s AND role = 'instructor'",
        (user_id, course_id)
    )
    instructor = cursor.fetchone()
    if instructor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
            )
    return True

def verifyInstructorOrTa(user_id: int, course_id: int):
    if isAdmin(user_id): return True
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT id FROM courses_role WHERE user_id = %s AND course_id = %s AND role IN ('instructor', 'ta')",
        (user_id, course_id)
    )
    role = cursor.fetchone()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
    return True

def verifyRoleInCourse(user_id: int, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT role FROM courses_role WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        role = cursor.fetchone()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have a role in this course"
            )
        return role[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
