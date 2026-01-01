from fastapi import APIRouter, Query, status, HTTPException
from services.users import fetch_course_roles_from_db, fetch_all_course_from_db

router = APIRouter()

@router.get("/user/{course_id}/roles")
def get_course_roles(course_id: int, user_id: int = Query(...)):
    
    role = fetch_course_roles_from_db(course_id, user_id)
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roles found for the user in this course"
        )
        
    return {"role": role}

@router.get("/me/courses")
def get_my_courses(user_id: int = Query(...), course_status: str | None = Query(None)):
    
    user_courses = fetch_all_course_from_db(user_id, course_status)
    
    if not user_courses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No courses found for the user"
        )
        
    return {"courses": user_courses}

@router.get("/me/courses?roles={role}")
def get_my_courses_by_role(role: str, user_id: int = Query(...), course_status: str | None = Query(None)):
    
    user_courses = fetch_all_course_from_db(user_id, course_status, role)
    
    if not user_courses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No courses found for the user with the specified role"
        )
        
    return {"courses": user_courses}
