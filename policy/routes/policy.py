from fastapi import APIRouter, HTTPException, status
from models.schema.policy import CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentRequest, CreatePolicyComponentRequest, AssignPolicyRequest
from utils.auth import verifyRoleInCourse, verifyInstructorOrTA, verifyAdmin
from utils.feature_flags import is_feature_enabled
from services.policy import add_policy_to_db, get_policy_from_db, delete_policy_from_db, update_policy_in_db, delete_policy_component_from_db, update_component_in_db, initialize_total_recalculation, fetch_total_scores_from_db, add_policy_component_to_db, set_policy_as_default_in_db, assign_policy_to_student_in_db, get_student_policy_mapping_from_db, get_assessment_categories_from_db, delete_student_course_data_from_db


router = APIRouter()

@router.get("/assessment-categories")
async def get_assessment_categories():
    categories = get_assessment_categories_from_db()
    return {"categories": categories}

@router.post("/courses/{course_id}/policy")
async def create_policy(course_id: int, data: CreatePolicyRequest):
    if await verifyAdmin(data.set_by_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(data.set_by_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": data.set_by_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    is_first_policy = get_policy_from_db(course_id) is None
    policy_id = add_policy_to_db(course_id, data)
    if is_first_policy and policy_id:
        set_policy_as_default_in_db(course_id, policy_id)
    
    if not policy_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy"
        )
        
    return {"policy_id": policy_id}

@router.get("/courses/{course_id}/policy")
async def get_all_policy(course_id: int, user_id: int):
    if not await verifyAdmin(user_id):
        verified = await verifyRoleInCourse(user_id, course_id)
        if not verified.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Instructor privileges required"
            )
        
    policy = get_policy_from_db(course_id)
        
    return {"policy": policy}

@router.get("/courses/{course_id}/policy/{policy_id}")
async def get_policy_by_id(course_id: int, policy_id: int, user_id: int):
    if not await verifyAdmin(user_id):
        verified = await verifyRoleInCourse(user_id, course_id)
        if not verified.get("success", False):
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
    if await verifyAdmin(user_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(user_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = delete_policy_from_db(course_id, policy_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy"
        )
        
    return {"detail": "Policy deleted successfully"}

@router.put("/courses/{course_id}/policy")
async def update_policy(course_id: int, data: UpdatePolicyRequest):
    if await verifyAdmin(data.updated_by_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(data.updated_by_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": data.updated_by_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = update_policy_in_db(data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy"
        )
        
    await initialize_total_recalculation(course_id, data.updated_by_id)
    return {"detail": "Policy updated successfully"}

@router.put("/courses/{course_id}/policy/{policy_id}/default")
async def set_policy_as_default(course_id: int, policy_id: int, user_id: int):
    if await verifyAdmin(user_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(user_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = set_policy_as_default_in_db(course_id, policy_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set policy as default"
        )
        
    await initialize_total_recalculation(course_id, user_id)
    return {"detail": "Policy set as default successfully"}

@router.delete("/courses/{course_id}/policy/{policy_id}/components/{component_id}")
async def delete_policy_component(course_id: int, policy_id: int, component_id: int, user_id: int):
    if await verifyAdmin(user_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(user_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = delete_policy_component_from_db(course_id, policy_id, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete policy component"
        )
        
    await initialize_total_recalculation(course_id, user_id)
    return {"detail": "Policy component deleted successfully"}

@router.post("/courses/{course_id}/policy/{policy_id}/components")
async def create_policy_component(course_id: int, policy_id: int, data: CreatePolicyComponentRequest):
    if await verifyAdmin(data.added_by_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(data.added_by_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": data.added_by_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    component_id = add_policy_component_to_db(course_id, policy_id, data)
    
    if not component_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create policy component"
        )
    
    await initialize_total_recalculation(course_id, data.added_by_id)
    return {"component_id": component_id}

@router.put("/courses/{course_id}/policy/{policy_id}/components/{component_id}")
async def update_policy_component(course_id: int, policy_id: int, component_id: int, data: UpdatePolicyComponentRequest):
    if await verifyAdmin(data.updated_by_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(data.updated_by_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": data.updated_by_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = update_component_in_db(data, policy_id, component_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update policy component"
        )
        
    await initialize_total_recalculation(course_id, data.updated_by_id)
    return {"detail": "Policy component updated successfully"}

@router.post("/courses/{course_id}/policy-assignments")
async def assign_policy_to_student(course_id: int, data: AssignPolicyRequest):
    if await verifyAdmin(data.assigned_by_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(data.assigned_by_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": data.assigned_by_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    success = assign_policy_to_student_in_db(course_id, data)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign policy to student"
        )
        
    await initialize_total_recalculation(course_id, data.assigned_by_id)
    return {"detail": "Policy assigned to student successfully"}

@router.get("/courses/{course_id}/policy-assignments")
async def get_policy_assignments(course_id: int, user_id: int):
    if await verifyAdmin(user_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(user_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_policy_management", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA policy management is disabled")
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    assignments = get_student_policy_mapping_from_db(course_id)
    
    return {"assignments": assignments}

@router.post("/courses/{course_id}/policy/recalculate")
async def recalculate_policy(course_id: int, user_id: int):
    if await verifyAdmin(user_id):
        role = "instructor"
    else:
        try:
            verified_data = await verifyRoleInCourse(user_id, course_id)
            role = verified_data.get("role")
        except HTTPException as e:
            if e.status_code == 403:
                raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
            raise e
    
    if role == "instructor" or role == "ta":
        pass
    else:
        raise HTTPException(status_code=403, detail="Instructor or authorized TA privileges required")
        
    await initialize_total_recalculation(course_id, user_id)
    
    return {"detail": "Policy recalculation initiated"}

@router.get("/courses/{course_id}/total")
async def get_total_scores_of_all_students(course_id: int, user_id: int):
    if not await verifyAdmin(user_id):
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
    if await verifyAdmin(user_id):
        role = "instructor"
        success = True
    else:
        verified = await verifyRoleInCourse(user_id, course_id)
        role = verified.get("role")
        success = verified.get("success", False)
    
    if role == 'student':
        if student_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if not is_feature_enabled("course.total_marks_visibility", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="Total marks visibility is disabled for students")
            
    if not success:
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

@router.delete("/{course_id}/student/{student_id}/data")
async def delete_student_course_data(course_id: int, student_id: int, user_id: int = 0):
    """Delete policy assignments and computed totals for a student in a course (called on unenrollment)."""
    result = delete_student_course_data_from_db(course_id, student_id)
    return {"detail": f"Cleaned up policy data for student {student_id}", **result}
