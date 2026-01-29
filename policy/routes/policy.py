from fastapi import APIRouter, HTTPException, status
from models.schema.policy import CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentRequest, CreatePolicyComponentRequest, AssignPolicyRequest
from utils.auth import verifyInstructor, verifyRoleInCourse, verifyInstructorOrTA
from services.policy import add_policy_to_db, get_policy_from_db, delete_policy_from_db, update_policy_in_db, delete_policy_component_from_db, update_component_in_db, initialize_total_recalculation, fetch_total_scores_from_db, add_policy_component_to_db, set_policy_as_default_in_db, assign_policy_to_student_in_db, get_student_policy_mapping_from_db


router = APIRouter()

@router.post("/courses/{course_id}/policy")
async def create_policy(course_id: int, data: CreatePolicyRequest):
    verified = await verifyInstructor(data.set_by_id, course_id)
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
async def get_all_policy(course_id: int, user_id: int):
    verified = await verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    policy = get_policy_from_db(course_id)
        
    return {"policy": policy}

@router.get("/courses/{course_id}/policy/{policy_id}")
async def get_policy_by_id(course_id: int, policy_id: int, user_id: int):
    verified = await verifyRoleInCourse(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    policy = get_policy_from_db(course_id, policy_id)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No policy found for the specified course and policy ID"
        )
        
    return {"policy": policy}

@router.delete("/courses/{course_id}/policy/{policy_id}")
async def delete_policy(course_id: int, policy_id: int, user_id: int):
    verified = await verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = delete_policy_from_db(course_id, policy_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy"
        )
        
    return {"detail": "Policy deleted successfully"}

@router.put("/courses/{course_id}/policy")
async def update_policy(course_id: int, data: UpdatePolicyRequest):
    verified = await verifyInstructor(data.updated_by_id, course_id)
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

@router.put("/courses/{course_id}/policy/{policy_id}/default")
async def set_policy_as_default(course_id: int, policy_id: int, user_id: int):
    verified = await verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = set_policy_as_default_in_db(course_id, policy_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set policy as default"
        )
        
    return {"detail": "Policy set as default successfully"}

@router.delete("/courses/{course_id}/policy/{policy_id}/components/{component_id}")
async def delete_policy_component(course_id: int, policy_id: int, component_id: int, user_id: int):
    verified = await verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = delete_policy_component_from_db(course_id, policy_id, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy component"
        )
        
    return {"detail": "Policy component deleted successfully"}

@router.post("/courses/{course_id}/policy/{policy_id}/components")
async def create_policy_component(course_id: int, policy_id: int, data: CreatePolicyComponentRequest):
    verified = await verifyInstructor(data.added_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    component_id = add_policy_component_to_db(course_id, policy_id, data)
    
    if not component_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy component"
        )
        
    return {"component_id": component_id}

@router.put("/courses/{course_id}/policy/{policy_id}/components/{component_id}")
async def update_policy_component(course_id: int, policy_id: int, component_id: int, data: UpdatePolicyComponentRequest):
    verified = await verifyInstructor(data.updated_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = update_component_in_db(data, policy_id, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy component"
        )
        
    return {"detail": "Policy component updated successfully"}

@router.post("/courses/{course_id}/policy-assignments")
async def assign_policy_to_student(course_id: int, data: AssignPolicyRequest):
    verified = await verifyInstructor(data.assigned_by_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    success = assign_policy_to_student_in_db(course_id, data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign policy to student"
        )
        
    return {"detail": "Policy assigned to student successfully"}

@router.get("/courses/{course_id}/policy-assignments")
async def get_policy_assignments(course_id: int, user_id: int):
    verified = await verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    assignments = get_student_policy_mapping_from_db(course_id)
    
    return {"assignments": assignments}

@router.post("/courses/{course_id}/policy/recalculate")
async def recalculate_policy(course_id: int, user_id: int):
    verified = await verifyInstructor(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor privileges required"
        )
        
    await initialize_total_recalculation(course_id, user_id)
    
    return {"detail": "Policy recalculation initiated"}

@router.get("/courses/{course_id}/total")
async def get_total_scores_of_all_students(course_id: int, user_id: int):
    verified = await verifyInstructorOrTA(user_id, course_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor or TA privileges required"
        )
        
    totals = fetch_total_scores_from_db(course_id)
        
    return {"totals": totals}

@router.get("/courses/{course_id}/total/{student_id}")
async def get_total_score_for_studet(course_id: int, student_id: int, user_id: int):
    verified = await verifyRoleInCourse(user_id, course_id)
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
