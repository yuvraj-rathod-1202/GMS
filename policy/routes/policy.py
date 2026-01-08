from fastapi import APIRouter, HTTPException, status
from models.schema.policy import CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentRequest, CreatePolicyComponentRequest
from utils.auth import verifyInstructor, verifyRoleInCourse, verifyInstructorOrTA
from services.policy import add_policy_to_db, get_policy_from_db, delete_policy_from_db, update_policy_in_db, delete_policy_component_from_db, update_component_in_db, initialize_total_recalculation, fetch_total_scores_from_db, add_policy_component_to_db


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

@router.delete("/courses/{course_id}/policy")
def delete_policy(course_id: int, user_id: int):
    verified = verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = delete_policy_from_db(course_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy"
        )
        
    return {"detail": "Policy deleted successfully"}

@router.put("/courses/{course_id}/policy")
def update_policy(course_id: int, data: UpdatePolicyRequest):
    verified = verifyInstructor(data.updated_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = update_policy_in_db(data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy"
        )
        
    return {"detail": "Policy updated successfully"}

@router.delete("/courses/{course_id}/policy/components/{component_id}")
def delete_policy_component(course_id: int, component_id: int, user_id: int):
    verified = verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = delete_policy_component_from_db(course_id, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy component"
        )
        
    return {"detail": "Policy component deleted successfully"}

@router.post("/courses/{course_id}/policy/components")
def create_policy_component(course_id: int, data: CreatePolicyComponentRequest):
    verified = verifyInstructor(data.added_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    component_id = add_policy_component_to_db(course_id, data)
    
    if not component_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy component"
        )
        
    return {"component_id": component_id}

@router.put("/courses/{course_id}/policy/components/{component_id}")
def update_policy_component(course_id: int, component_id: int, data: UpdatePolicyComponentRequest):
    verified = verifyInstructor(data.updated_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = update_component_in_db(data, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy component"
        )
        
    return {"detail": "Policy component updated successfully"}

@router.post("/courses/{course_id}/policy/recalculate")
async def recalculate_policy(course_id: int, user_id: int):
    verified = verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    await initialize_total_recalculation(course_id, user_id)
    
    return {"detail": "Policy recalculation initiated"}

@router.get("/courses/{course_id}/total")
async def get_total_scores_of_all_students(course_id: int, user_id: int):
    verified = verifyInstructorOrTA(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    totals = fetch_total_scores_from_db(course_id)
    
    if not totals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No total scores found for the specified course"
        )
        
    return {"totals": totals}

@router.get("/courses/{course_id}/total/{student_id}")
async def get_total_score_for_studet(course_id: int, student_id: int, user_id: int):
    verified = verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor, TA, or student privileges required"
        )
        
    totals = fetch_total_scores_from_db(course_id, student_id)
    
    if not totals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No total score found for the specified student in the course"
        )
        
    return {"totals": totals}
