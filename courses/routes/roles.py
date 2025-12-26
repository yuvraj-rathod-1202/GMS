from fastapi import APIRouter, HTTPException, status
from utils.auth import verifyAdmin, verifyInstructor, verifyInstructorOrTa
from models.schemas.roles import EnrollStudentRequest, EnrollTaRequest, EnrollInstructorRequest
from services.roles import enroll_student_in_course_in_db
from pydantic import EmailStr

router = APIRouter()

@router.post("/{course_id}/enroll")
def enroll_student(course_id: int, data: EnrollStudentRequest):
    verified = verifyInstructorOrTa(data.email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    enrolled_id = enroll_student_in_course_in_db(course_id, data.student_email)
    
    if not enrolled_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enroll student"
        )
        
    return {"enrolled_id": enrolled_id}

@router.delete("/{course_id}/enroll")
def unenroll_student(course_id: int, email: EmailStr, student_email: EmailStr):
    verified = verifyInstructorOrTa(email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    unenrolled_id = enroll_student_in_course_in_db(course_id, student_email, enroll=False)
    
    if not unenrolled_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unenroll student"
        )
        
    return {"unenrolled_id": unenrolled_id}

@router.post("/{course_id}/tas")
def assign_ta(course_id: int, data: EnrollTaRequest):
    verified = verifyInstructor(data.email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    assigned_id = enroll_student_in_course_in_db(course_id, data.ta_email, assign_ta=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign TA"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/tas")
def remove_ta(course_id: int, email: EmailStr, ta_email: EmailStr):
    verified = verifyInstructor(email, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    removed_id = enroll_student_in_course_in_db(course_id, ta_email, enroll=False, assign_ta=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove TA"
        )
        
    return {"removed_id": removed_id}

@router.post("/{course_id}/instructors")
def assign_instructor(course_id: int, data: EnrollInstructorRequest):
    verified = verifyAdmin(data.email)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    assigned_id = enroll_student_in_course_in_db(course_id, data.instructor_email, assign_instructor=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign instructor"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/instructors")
def remove_instructor(course_id: int, email: EmailStr, instructor_email: EmailStr):
    verified = verifyAdmin(email)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    removed_id = enroll_student_in_course_in_db(course_id, instructor_email, enroll=False, assign_instructor=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove instructor"
        )
        
    return {"removed_id": removed_id}

