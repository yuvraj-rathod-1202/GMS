from fastapi import APIRouter, HTTPException, status
from utils.auth import verifyAdmin, verifyInstructor, verifyInstructorOrTa
from models.schemas.courses import GetAllCourseRequest, AddCourseRequest, UpdateCourseStatusRequest, DeleteCourseRequest, GetAllRolesRequest
from services.courses import fetch_all_courses_from_db, add_course_to_db, fetch_course_by_id_from_db, update_course_status_in_db, delete_course_from_db, fetch_course_roles_from_db

router = APIRouter()

@router.get("/")
def get_courses(data: GetAllCourseRequest):
    verified = verifyAdmin(data.email)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    course_list = fetch_all_courses_from_db()
    
    if not course_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No courses found"
        )
        
    return {"courses": course_list}

@router.post("/")
def add_course(data: AddCourseRequest):
    verified = verifyAdmin(data.email)
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

@router.get("/{course_id}")
def get_course_by_id(course_id: int):
    
    course = fetch_course_by_id_from_db(course_id)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    return {"course": course}

@router.put("/{course_id}")
def update_course(course_id: int, data: UpdateCourseStatusRequest):
    verified = verifyInstructor(data.email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = update_course_status_in_db(course_id=course_id, update_data=data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )
        
    return {"message": "Course updated successfully"}

@router.delete("/{course_id}")
def delete_course(course_id: int, data: DeleteCourseRequest):
    verified = verifyAdmin(data.email)
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

@router.get("/{course_id}/roles?role={role}")
def get_course_roles(course_id: int, role: str, data: GetAllRolesRequest):
    verified = verifyInstructorOrTa(data.email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    role_emails = fetch_course_roles_from_db(course_id=course_id, role=role)
    
    if not role_emails:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No roles found for the specified course"
        )
    
    return {"roles": role_emails}
