from fastapi import HTTPException, status
from models.dbobj.courses import CoursesDBObject
from models.schemas.courses import UpdateCourseStatusRequest
from utils.db import get_db

def fetch_all_courses_from_db():
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT id, course_code, name, semester, credits, status, total_students, created_at, updated_at FROM courses"
        )
        courses = cursor.fetchall()
        course_list = []
        for course in courses:
            courseObj = CoursesDBObject(
                id=course[0],
                course_code=course[1],
                name=course[2],
                semester=course[3],
                credits=course[4],
                status=course[5],
                total_students=course[6],
                created_at=course[7],
                updated_at=course[8],
            )
            course_list.append(courseObj)
            
        return course_list
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching courses: {str(e)}"
        )

def add_course_to_db(course_code: str, name: str, semester: str, credits: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO courses (course_code, name, semester, credits, status, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, NOW(), NOW())",
            (course_code, name, semester, credits, 'ongoing')
        )
        db.commit()
        return cursor.lastrowid
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding course: {str(e)}"
        )

def fetch_course_by_id_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT id, course_code, name, semester, credits, status, total_students, created_at, updated_at FROM courses WHERE id = %s",
            (course_id,)
        )
        course = cursor.fetchone()
        if course is None:
            return None
        
        courseObj = CoursesDBObject(
            id=course[0],
            course_code=course[1],
            name=course[2],
            semester=course[3],
            credits=course[4],
            status=course[5],
            total_students=course[6],
            created_at=course[7],
            updated_at=course[8],
        )
        return courseObj
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching course: {str(e)}"
        )

def update_course_status_in_db(course_id: int, update_data: UpdateCourseStatusRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        
        fields = []
        values = []
        
        if update_data.status is not None:
            fields.append("status = %s")
            values.append(update_data.status)
        if update_data.course_code is not None:
            fields.append("course_code = %s")
            values.append(update_data.course_code)
        if update_data.name is not None:
            fields.append("name = %s")
            values.append(update_data.name)
        if update_data.credits is not None:
            fields.append("credits = %s")
            values.append(update_data.credits)
            
        if not fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
            
        values.append(course_id)
        
        query = f"UPDATE courses SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s"
        
        cursor.execute(query, tuple(values))
        db.commit()
        
        return cursor.rowcount > 0
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating course: {str(e)}"
        )

def delete_course_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        cursor.execute(
            "DELETE FROM courses WHERE id = %s",
            (course_id,)
        )
        db.commit()
        return cursor.rowcount > 0
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting course: {str(e)}"
        )

def fetch_course_roles_from_db(course_id: int, role: str):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT cr.user_id, COALESCE(cr.email, ie.email) as email "
            "FROM courses_role cr "
            "LEFT JOIN id_email_map ie ON cr.user_id = ie.user_id "
            "WHERE cr.course_id = %s AND cr.role = %s",
            (course_id, role)
        )
        roles = cursor.fetchall()
        
        if not roles:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No roles found for the specified course"
            )
            
        role_data = [{"user_id": r[0], "email": r[1]} for r in roles]
        
        return role_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching course roles: {str(e)}"
        )