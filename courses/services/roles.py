from fastapi import status, HTTPException
from utils.db import get_db

def enroll_student_in_course_in_db(course_id: int, student_email: str, enroll: bool = True, assign_ta: bool = False, assign_instructor: bool = False) -> int | None:
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    cursor = db.cursor()
    
    cursor.execute(
        "SELECT id FROM courses_role WHERE email = %s AND course_id = %s AND role = %s",
        (student_email, course_id, 'instructor' if assign_instructor else ('ta' if assign_ta else 'student'))
    )
    role_id = cursor.fetchone()
    if role_id:
        if enroll:
            return None  # Student already enrolled
        else:
            try:
                cursor.execute(
                    "DELETE FROM courses_role WHERE id = %s",
                    (role_id[0],)
                )
                db.commit()
                return role_id[0]
            except Exception as e:
                db.rollback()
                return None
            
    if not enroll:
        return None # Student not enrolled, cannot unenroll
    
    try:
        cursor.execute(
            "INSERT INTO courses_role (course_id, email, role, assigned_at) "
            "VALUES (%s, %s, %s, NOW())",
            (course_id, student_email, 'instructor' if assign_instructor else ('ta' if assign_ta else 'student'))
        )
        db.commit()
        return cursor.lastrowid
    except Exception as e:
        db.rollback()
        return None
