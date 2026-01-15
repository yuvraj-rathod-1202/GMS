from fastapi import APIRouter, HTTPException, Query, status
from utils.auth import verifyAdmin, verifyInstructor, verifyInstructorOrTa
from models.schemas.roles import EnrollStudentRequest, EnrollTaRequest, EnrollInstructorRequest, BulkEnrollStudentRequest
from services.roles import enroll_student_in_course_in_db

router = APIRouter()

@router.post("/{course_id}/enroll")
def enroll_student(course_id: int, data: EnrollStudentRequest):
    verified = verifyInstructorOrTa(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    enrolled_id = enroll_student_in_course_in_db(course_id, data.student_id, data.email)
    
    if enrolled_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student already enrolled in this course"
        )
        
    return {"id": enrolled_id, "message": "Student enrolled successfully"}

@router.post("/{course_id}/enroll/bulk")
def enroll_students_bulk(course_id: int, data: BulkEnrollStudentRequest):
    verified = verifyInstructorOrTa(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    enrolled_ids = []
    for student in data.students:
        enrolled_id = enroll_student_in_course_in_db(course_id, student.student_id, student.email)
        if enrolled_id is not None:
            enrolled_ids.append(enrolled_id)
    
    return {"enrolled_ids": enrolled_ids, "message": "Students enrolled successfully"}

@router.delete("/{course_id}/enroll")
def unenroll_student(course_id: int, user_id: int = Query(...), student_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    unenrolled_id = enroll_student_in_course_in_db(course_id, student_id, enroll=False)
    
    if not unenrolled_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unenroll student"
        )
        
    return {"unenrolled_id": unenrolled_id}

@router.post("/{course_id}/tas")
def assign_ta(course_id: int, data: EnrollTaRequest):
    verified = verifyInstructor(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    assigned_id = enroll_student_in_course_in_db(course_id, data.ta_id, assign_ta=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign TA"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/tas")
def remove_ta(course_id: int, user_id: int = Query(...), ta_id: int = Query(...)):
    verified = verifyInstructor(user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    removed_id = enroll_student_in_course_in_db(course_id, ta_id, enroll=False, assign_ta=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove TA"
        )
        
    return {"removed_id": removed_id}

@router.post("/{course_id}/instructors")
def assign_instructor(course_id: int, data: EnrollInstructorRequest):
    verified = verifyAdmin(data.user_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    assigned_id = enroll_student_in_course_in_db(course_id, data.instructor_id, assign_instructor=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign instructor"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/instructors")
def remove_instructor(course_id: int, user_id: int = Query(...), instructor_id: int = Query(...)):
    verified = verifyAdmin(user_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    removed_id = enroll_student_in_course_in_db(course_id, instructor_id, enroll=False, assign_instructor=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove instructor"
        )
        
    return {"removed_id": removed_id}

