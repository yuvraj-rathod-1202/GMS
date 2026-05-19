from fastapi import APIRouter, HTTPException, status, Query
from utils.auth import verifyAdmin, verifyInstructorOrTa
from models.schemas.courses import AddCourseRequest, UpdateCourseStatusRequest
from services.courses import fetch_all_courses_from_db, add_course_to_db, fetch_course_by_id_from_db, update_course_status_in_db, delete_course_from_db, fetch_course_roles_from_db

router = APIRouter()

@router.get("/all")
def get_courses(limit: int = 50, offset: int = 0, user_id: int = Query(...), search: str = None):
    verified = verifyAdmin(user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    course_list = fetch_all_courses_from_db(limit=limit, offset=offset, search=search)
        
    return {"courses": course_list}

@router.post("/")
def add_course(data: AddCourseRequest):
    verified = verifyAdmin(data.user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    course_id = add_course_to_db(
        course_code=data.course_code,
        name=data.name,
        semester=data.semester,
        credits=data.credits
    )
    
    if not course_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add course"
        )
        
    return {"course_id": course_id}

@router.get("/id/{course_id}")
def get_course_by_id(course_id: int):
    
    course = fetch_course_by_id_from_db(course_id)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    return {"course": course}

@router.put("/id/{course_id}")
def update_course(course_id: int, data: UpdateCourseStatusRequest):
    verified = verifyAdmin(data.user_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    success = update_course_status_in_db(course_id=course_id, update_data=data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )
        
    return {"message": "Course updated successfully"}

@router.delete("/id/{course_id}")
def delete_course(course_id: int, user_id: int = Query(...)):
    verified = verifyAdmin(user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    success = delete_course_from_db(course_id=course_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete course"
        )
        
    return {"message": "Course deleted successfully"}

@router.get("/id/{course_id}/roles/{role}")
def get_course_roles(course_id: int, role: str, user_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    role_user_ids = fetch_course_roles_from_db(course_id=course_id, role=role)
    
    return {"roles": role_user_ids}
