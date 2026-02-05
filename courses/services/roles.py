from fastapi import status, HTTPException
from utils.db import get_db
from dotenv import load_dotenv
import logging, os
import httpx

load_dotenv()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")
        
async def ensure_bulk_user_exists(user_email_data: list[tuple[int, str]]):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/signup/bulk",
                json={"users": [{"id": user_id, "email": email, "password": str(user_id)} for user_id, email in user_email_data]}
            )
        except Exception as e:
            return False

async def enroll_student_in_course_in_db(course_id: int, student_id: int, email: str | None = None, enroll: bool = True, assign_ta: bool = False, assign_instructor: bool = False) -> int | None:
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    target_role = 'instructor' if assign_instructor else 'ta' if assign_ta else 'student'
    result_id = None
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id FROM courses_role WHERE user_id = %s AND course_id = %s AND role = %s",
            (student_id, course_id, target_role)
        )
        role_id = cursor.fetchone()
        if enroll and not role_id:
            if email:
                await ensure_bulk_user_exists([(student_id, email)])
                cursor.execute(
                    "INSERT IGNORE INTO id_email_map (user_id, email) VALUES (%s, %s)",
                    (student_id, email)
                )
                
            cursor.execute(
                "INSERT IGNORE INTO courses_role (course_id, user_id, email, role, assigned_at) VALUES (%s, %s, %s, %s, NOW())",
                (course_id, student_id, email, target_role)
            )
            result_id = cursor.lastrowid
            
        elif not enroll and role_id:
            cursor.execute(
                "DELETE FROM courses_role WHERE id = %s",
                (role_id[0],)
            )
            result_id = role_id[0]
        
        if result_id and target_role == 'student':
            cursor.execute(
                "UPDATE courses SET total_students = (select count(*) from courses_role where course_id = %s and role = 'student') WHERE id = %s",
                (course_id, course_id)
            )
            
        db.commit()
        return result_id
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while enrolling student" if IS_PRODUCTION else f"Failed to enroll student: {str(e)}"
        )

async def enroll_student_in_bulk(course_id: int, enroll: bool, students: list[tuple[int, str | None]], assign_ta: bool = False, assign_instructor: bool = False):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    target_role = 'instructor' if assign_instructor else 'ta' if assign_ta else 'student'
    email_data = []
    for s in students:
        student_id, email = s
        if email is not None:
            email_data.append((student_id, email))
    
    try:
        await ensure_bulk_user_exists(email_data)
        cursor = db.cursor()
        
        cursor.executemany(
            "INSERT IGNORE INTO id_email_map (user_id, email) VALUES (%s, %s)",
            email_data
        )
        
        if enroll:
            cursor.executemany(
                "INSERT IGNORE INTO courses_role (course_id, user_id, email, role, assigned_at) VALUES (%s, %s, %s, %s, NOW())",
                [(course_id, student_id, email, target_role) for student_id, email in students]
            )
            
        if not enroll:
            cursor.executemany(
                "DELETE FROM courses_role WHERE user_id = %s AND course_id = %s AND role = %s",
                [(student_id, course_id, target_role) for student_id, _ in students]
            )
            
        cursor.execute(
            "UPDATE courses SET total_students = (select count(*) from courses_role where course_id = %s and role = 'student') WHERE id = %s",
            (course_id, course_id)
        )
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while enrolling student" if IS_PRODUCTION else f"Failed to enroll student: {str(e)}"
        )