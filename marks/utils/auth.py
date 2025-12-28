from fastapi import HTTPException, status
from utils.db import get_db

def verifyInstructor(email: str, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

def verifyInstructorOrTa(email: str, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

def verifyRoleInCourse(email: str, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT id FROM courses_role WHERE email = %s AND course_id = %s",
            (email, course_id)
        )
        role = cursor.fetchone()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have a role in this course"
            )
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )