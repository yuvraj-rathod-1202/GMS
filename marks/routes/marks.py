from fastapi import APIRouter, HTTPException, status, Query
from utils.auth import verifyInstructorOrTa, verifyRoleInCourse
from models.schemas.marks import AddMarksRequest
from services.marks import add_marks_to_db, get_marks_from_db, delete_marks_from_db, publish_marks_in_db, get_all_marks_from_db

router = APIRouter()

@router.post("/{course_id}/{assessment_id}/marks")
def add_marks(course_id: int, assessment_id: int, data: AddMarksRequest):
    verified = verifyInstructorOrTa(data.recorded_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
    
    success = add_marks_to_db(assessment_id, data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add marks"
        )
    
    return {"detail": "Marks added successfully"}

@router.get("/{course_id}/{assessment_id}/marks")
def get_marks(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    marks = get_marks_from_db(assessment_id)
    
    if not marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No marks found"
        )
        
    return {"marks": marks}

@router.get("/{course_id}/{assessment_id}/marks/{student_id}")
def get_student_marks(course_id: int, assessment_id: int, student_id: int, user_id: int = Query(...)):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    marks = get_marks_from_db(assessment_id, student_id)
    
    if not marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No marks found for the specified student"
        )
        
    return {"marks": marks}

@router.delete("/{course_id}/{assessment_id}/marks/{student_id}")
def delete_student_marks(course_id: int, assessment_id: int, student_id: int, user_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    success = delete_marks_from_db(assessment_id, student_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete marks"
        )
        
    return {"detail": "Marks deleted successfully"}

@router.put("/{course_id}/{assessment_id}/publish")
def publish_marks(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    success = publish_marks_in_db(assessment_id, publish=True)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish marks"
        )
        
    return {"detail": "Marks published successfully"}

@router.put("/{course_id}/{assessment_id}/unpublish")
def unpublish_marks(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = verifyInstructorOrTa(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    success = publish_marks_in_db(assessment_id, publish=False)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unpublish marks"
        )
        
    return {"detail": "Marks unpublished successfully"}

@router.get("/{course_id}/marks/all/{student_id}")
def get_all_marks_for_student(course_id: int, student_id: int, user_id: int = Query(...)):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
        
    marks = get_all_marks_from_db(student_id, course_id)
    
    if not marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No marks found for the specified student in this course"
        )
        
    return {"marks": marks}
