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
    if not user_email_data:
        return True
        
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            payload = {"users": [{"id": user_id, "email": email, "password": str(user_id)} for user_id, email in user_email_data]}
            logger.info(f"Sending bulk signup request to {AUTH_SERVICE_URL}/signup/bulk with {len(user_email_data)} users")
            
            response = await client.post(
                f"{AUTH_SERVICE_URL}/signup/bulk",
                json=payload
            )
            
            logger.info(f"Auth service response: status={response.status_code}, body={response.text}")
            response.raise_for_status()
            return True
        except httpx.TimeoutException as e:
            logger.warning(f"Auth service timeout (users may already exist): {str(e)}")
            return True
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from auth service: {e.response.status_code} - {e.response.text}")
            if e.response.status_code == 400:
                logger.info("Users may already exist in auth service, continuing enrollment")
                return True
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create users in auth service" if IS_PRODUCTION else f"Auth service HTTP error: {e.response.status_code}"
            )
        except httpx.RequestError as e:
            logger.error(f"Request error to auth service: {type(e).__name__} - {str(e)}")
            logger.warning("Auth service unreachable, continuing with enrollment (users may need to be created manually)")
            return True
        except Exception as e:
            logger.error(f"Unexpected error ensuring bulk user exists: {type(e).__name__} - {str(e)}")
            logger.warning("Unexpected error with auth service, continuing with enrollment")
            return True

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
        
def unenroll_all_students_in_course_in_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        cursor.execute(
            "DELETE FROM courses_role WHERE course_id = %s AND role = 'student'",
            (course_id,)
        )
        cursor.execute(
            "UPDATE courses SET total_students = 0 WHERE id = %s",
            (course_id,)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error unenrolling all students: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while unenrolling all students" if IS_PRODUCTION else f"Failed to unenroll all students: {str(e)}"
        )