from fastapi import APIRouter, HTTPException, status, Query
from utils.auth import verifyRoleInCourse
from utils.feature_flags import is_feature_enabled
from models.schemas.assessments import CreateAssessmentRequest, UpdateAssessmentRequest
from services.assessments import add_assessment_to_db, get_all_assessments_from_db, update_assessment_in_db, delete_assessment_from_db, fetch_system_wide_assessments
from utils.auth import verifyRoleInCourse, verifyAdmin

router = APIRouter()

@router.get("/assessments/all")
async def get_all_assessments_admin(limit: int = 50, offset: int = 0, user_id: int = Query(...)):
    verified = await verifyAdmin(user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return fetch_system_wide_assessments(limit, offset)

@router.post("/{course_id}/assessments")
async def create_assessment(course_id: int, data: CreateAssessmentRequest):
    # Check if user has basic permission (Instructor or TA)
    verified_data = await verifyRoleInCourse(data.user_id, course_id)
    role = verified_data.get("role")
    
    if role == "instructor":
        pass # OK
    elif role == "ta":
        if not is_feature_enabled("course.ta_assessment_management", {"course_id": course_id, "user_id": data.user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA assessment management is disabled for this course")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    assessment_id = add_assessment_to_db(course_id, data)
    
    if not assessment_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )
        
    return {"assessment_id": assessment_id}

@router.get("/{course_id}/assessments")
async def get_all_assessments(course_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have a role in this course"
        )
    
    assessments = get_all_assessments_from_db(course_id)
    
    return {"assessments": assessments}

@router.get("/assessments/{course_id}/{assessment_id}")
async def get_assessment(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
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
async def update_assessment(course_id: int, assessment_id: int, data: UpdateAssessmentRequest):
    verified_data = await verifyRoleInCourse(data.user_id, course_id)
    role = verified_data.get("role")
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_assessment_management", {"course_id": course_id, "user_id": data.user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA assessment management is disabled for this course")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
    
    success = update_assessment_in_db(course_id, assessment_id, data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assessment"
        )
    
    return {"detail": "Assessment updated successfully"}
    
@router.delete("/assessments/{course_id}/{assessment_id}")
async def delete_assessment(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified_data = await verifyRoleInCourse(user_id, course_id)
    role = verified_data.get("role")
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_assessment_management", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA assessment management is disabled for this course")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
    
    success = delete_assessment_from_db(course_id, assessment_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete assessment"
        )
    
    return {"detail": "Assessment deleted successfully"}

