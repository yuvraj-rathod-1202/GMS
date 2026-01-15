from fastapi import status, HTTPException
from utils.db import get_db

def enroll_student_in_course_in_db(course_id: int, student_id: int, email: str | None = None, enroll: bool = True, assign_ta: bool = False, assign_instructor: bool = False) -> int | None:
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id FROM courses_role WHERE user_id = %s AND course_id = %s AND role = %s",
            (student_id, course_id, 'instructor' if assign_instructor else ('ta' if assign_ta else 'student'))
        )
        role_id = cursor.fetchone()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database query error"
        )
    if role_id:
        if enroll:
            return None  # Student already enrolled
        else:
            try:
                cursor.execute(
                    "DELETE FROM courses_role WHERE id = %s",
                    (role_id[0],)
                )
                if not assign_ta and not assign_instructor:
                    cursor.execute(
                        "UPDATE courses SET total_students = total_students - 1 WHERE id = %s",
                        (course_id,)
                    )
                db.commit()
                return role_id[0]
            except Exception as e:
                db.rollback()
                print(f"Error unenrolling student: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to unenroll student: {str(e)}"
                )
            
    if not enroll:
        return None # Student not enrolled, cannot unenroll
    
    # Store email in id_email_map if provided and not already exists
    if email:
        try:
            cursor.execute(
                "INSERT IGNORE INTO id_email_map (user_id, email) VALUES (%s, %s)",
                (student_id, email)
            )
        except Exception as e:
            print(f"Warning: Could not store email mapping: {e}")
    
    try:
        cursor.execute(
            "INSERT INTO courses_role (course_id, user_id, email, role, assigned_at) "
            "VALUES (%s, %s, %s, %s, NOW())",
            (course_id, student_id, email, 'instructor' if assign_instructor else ('ta' if assign_ta else 'student'))
        )
        id = cursor.lastrowid
        if not assign_ta and not assign_instructor:
            cursor.execute(
                "UPDATE courses SET total_students = total_students + 1 WHERE id = %s",
                (course_id,)
            )
        db.commit()
        return id
    except Exception as e:
        db.rollback()
        print(f"Error enrolling student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enroll: {str(e)}"
        )
