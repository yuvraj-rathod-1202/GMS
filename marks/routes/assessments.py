from fastapi import APIRouter, HTTPException, status, Query
from utils.auth import verifyInstructor, verifyRoleInCourse
from models.schemas.assessments import CreateAssessmentRequest, UpdateAssessmentRequest
from services.assessments import add_assessment_to_db, get_all_assessments_from_db, update_assessment_in_db, delete_assessment_from_db

router = APIRouter()

@router.post("/{course_id}/assessments")
def create_assessment(course_id: int, data: CreateAssessmentRequest):
    verified = verifyInstructor(data.user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    assessment_id = add_assessment_to_db(course_id, data)
    
    if not assessment_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )
        
    return {"assessment_id": assessment_id}

@router.get("/{course_id}/assessments")
def get_all_assessments(course_id: int, user_id: int = Query(...)):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have a role in this course"
        )
    
    assessments = get_all_assessments_from_db(course_id)
    
    if not assessments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessments found for this course"
        )
    
    return {"assessments": assessments}

@router.get("/assessments/{course_id}/{assessment_id}")
def get_assessment(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have a role in this course"
        )
    
    assessments = get_all_assessments_from_db(course_id, assessment_id)
    
    if not assessments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
        
    return {"assessments": assessments}

@router.put("/assessments/{course_id}/{assessment_id}")
def update_assessment(course_id: int, assessment_id: int, data: UpdateAssessmentRequest):
    verified = verifyInstructor(data.user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
    
    success = update_assessment_in_db(course_id, assessment_id, data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assessment"
        )
    
    return {"detail": "Assessment updated successfully"}
    
@router.delete("/assessments/{course_id}/{assessment_id}")
def delete_assessment(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
    
    success = delete_assessment_from_db(course_id, assessment_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete assessment"
        )
    
    return {"detail": "Assessment deleted successfully"}

