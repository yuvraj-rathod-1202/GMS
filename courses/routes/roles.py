from fastapi import APIRouter, HTTPException, Query, status
from utils.auth import verifyAdmin, verifyInstructor, verifyInstructorOrTa
from models.schemas.roles import EnrollStudentRequest, EnrollTaRequest, EnrollInstructorRequest, BulkEnrollStudentRequest, UnEnrollAllStudentRequest
from services.roles import enroll_student_in_bulk, enroll_student_in_course_in_db, unenroll_all_students_in_course_in_db, fetch_all_enrollments_from_db

router = APIRouter()

@router.get("/enrollments/all")
async def get_all_enrollments(limit: int = 50, offset: int = 0, user_id: int = Query(...)):
    verified = verifyAdmin(user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return fetch_all_enrollments_from_db(limit, offset)

@router.post("/{course_id}/enroll")
async def enroll_student(course_id: int, data: EnrollStudentRequest):
    verified = verifyInstructorOrTa(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    enrolled_id = await enroll_student_in_course_in_db(course_id, data.student_id, data.email)
    
    if enrolled_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student already enrolled in this course"
        )
        
    return {"id": enrolled_id, "message": "Student enrolled successfully"}

@router.post("/{course_id}/enroll/bulk")
async def enroll_students_bulk(course_id: int, data: BulkEnrollStudentRequest):
    verified = verifyInstructorOrTa(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    await enroll_student_in_bulk(course_id, True, [(student.student_id, student.email) for student in data.students])
    
    return {"message": "Students enrolled successfully"}

@router.post("/{course_id}/unenroll/all")
async def unenroll_all_students(course_id: int, data: UnEnrollAllStudentRequest):
    verified = verifyInstructorOrTa(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    unenroll_all_students_in_course_in_db(course_id)
    
    return {"message": "Students unenrolled successfully"}

@router.delete("/{course_id}/enroll")
async def unenroll_student(course_id: int, user_id: int = Query(...), student_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    unenrolled_id = await enroll_student_in_course_in_db(course_id, student_id, enroll=False)
    
    if not unenrolled_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unenroll student"
        )
        
    return {"unenrolled_id": unenrolled_id}

@router.post("/{course_id}/tas")
async def assign_ta(course_id: int, data: EnrollTaRequest):
    verified = verifyInstructor(data.user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    assigned_id = await enroll_student_in_course_in_db(course_id, data.ta_id, data.email, assign_ta=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign TA"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/tas")
async def remove_ta(course_id: int, user_id: int = Query(...), ta_id: int = Query(...)):
    verified = verifyInstructor(user_id, course_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    removed_id = await enroll_student_in_course_in_db(course_id, ta_id, enroll=False, assign_ta=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove TA"
        )
        
    return {"removed_id": removed_id}

@router.post("/{course_id}/instructors")
async def assign_instructor(course_id: int, data: EnrollInstructorRequest):
    verified = verifyAdmin(data.user_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    assigned_id = await enroll_student_in_course_in_db(course_id, data.instructor_id, data.email, assign_instructor=True)
    
    if not assigned_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign instructor"
        )
        
    return {"assigned_id": assigned_id}

@router.delete("/{course_id}/instructors")
async def remove_instructor(course_id: int, user_id: int = Query(...), instructor_id: int = Query(...)):
    verified = verifyAdmin(user_id)
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
        
    removed_id = await enroll_student_in_course_in_db(course_id, instructor_id, enroll=False, assign_instructor=True)
    
    if not removed_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove instructor"
        )
        
    return {"removed_id": removed_id}

