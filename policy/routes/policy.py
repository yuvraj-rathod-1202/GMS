from fastapi import APIRouter, HTTPException, status
from models.schema.policy import CreatePolicyRequest
from utils.auth import verifyInstructor, verifyRoleInCourse
from services.policy import add_policy_to_db, get_policy_from_db


router = APIRouter()

@router.post("/courses/{course_id}/policy")
def create_policy(course_id: int, data: CreatePolicyRequest):
    verified = verifyInstructor(data.set_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    policy_id = add_policy_to_db(course_id, data)
    
    if not policy_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy"
        )
        
    return {"policy_id": policy_id}

@router.get("/courses/{course_id}/policy")
def get_policy(course_id: int, user_id: int):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    policy = get_policy_from_db(course_id)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No policy found for the specified course"
        )
        
    return {"policy": policy}