from fastapi import APIRouter, status, HTTPException
from utils.auth import verifyAdmin, verifyInstructor, verifyInstructorOrTa
from models.schemas.users import GetCourseRoleRequest, GetAllCourseRoleRequest
from services.users import fetch_course_roles_from_db, fetch_all_course_from_db

router = APIRouter()

@router.get("user/{course_id}/roles")
def get_course_roles(course_id: int, data: GetCourseRoleRequest):
    
    role = fetch_course_roles_from_db(course_id, data.user_email)
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roles found for the user in this course"
        )
        
    return {"role": role}

@router.get("/me/courses")
def get_my_courses(data: GetAllCourseRoleRequest):
    
    user_courses = fetch_all_course_from_db(data.user_email, data.status)
    
    if not user_courses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No courses found for the user"
        )
        
    return {"courses": user_courses}

@router.get("/me/courses?roles={role}")
def get_my_courses_by_role(data: GetAllCourseRoleRequest, role: str):
    
    user_courses = fetch_all_course_from_db(data.user_email, data.status, role)
    
    if not user_courses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No courses found for the user with the specified role"
        )
        
    return {"courses": user_courses}
