from fastapi import status, HTTPException
from utils.db import get_db
from models.dbobj.users import CourseDBObject

def fetch_course_roles_from_db(course_id: int, user_email: str):
    db = get_db()
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    query = """
        SELECT role
        FROM courses_roles
        WHERE course_id = %s AND user_email = %s
    """
    cursor = db.cursor()
    cursor.execute(query, (course_id, user_email))
    result = cursor.fetchone()
    cursor.close()
    
    if result:
        return result[0]
    return None

def fetch_all_course_from_db(user_email: str, course_status: str | None = None, course_role: str | None = None):
    db = get_db()
    
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    query = """
        SELECT c.id, c.course_code, c.name, c.semester, c.credits, c.status, c.created_at, cr.role
        FROM courses c
        JOIN courses_roles cr ON c.id = cr.course_id
        WHERE cr.user_email = %s AND c.status = COALESCE(%s, c.status) AND cr.role = COALESCE(%s, cr.role)
    """
    cursor = db.cursor()
    cursor.execute(query, (user_email, course_status))
    results = cursor.fetchall()
    cursor.close()
    
    courses = []
    for row in results:
        courses.append(CourseDBObject(
            id=row[0],
            course_code=row[1],
            name=row[2],
            semester=row[3],
            credits=row[4],
            status=row[5],
            created_at=row[6],
            role=row[7]
        ))
        
    courses.sort(key=lambda x: x.created_at, reverse=True)
    
    return courses