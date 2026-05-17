from fastapi import APIRouter, HTTPException, Query, status
from utils.auth import verifyInstructor, verifyRoleInCourse, verifyAdmin
from utils.feature_flags import is_feature_enabled
from services.assessments import get_course_overview_from_db, get_assessment_analytics_from_db, get_assessment_frequencies_from_db, get_course_frequencies_from_db, get_system_overview_from_db

router = APIRouter()

@router.get("/{course_id}/analytics/overview")
async def get_course_analytics_overview(course_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
    role = verified.get("role")
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_analytics_visibility", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA analytics visibility is disabled")
    elif role == "student":
        if not is_feature_enabled("course.assessment_analytics", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="Student analytics visibility is disabled")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    overview = get_course_overview_from_db(course_id)
    return {"overview": overview}

@router.get("/{course_id}/analytics/frequencies")
async def get_course_frequencies(course_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
    role = verified.get("role")
    
    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_analytics_visibility", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA analytics visibility is disabled")
    elif role == "student":
        if not is_feature_enabled("course.assessment_analytics", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="Student analytics visibility is disabled")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    frequencies = get_course_frequencies_from_db(course_id)
    return {"frequencies": frequencies}

@router.get("/{course_id}/assessments/{assessment_id}/analytics")
async def get_assessment_analytics(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
    role = verified.get("role")

    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_analytics_visibility", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA analytics visibility is disabled")
    elif role == "student":
        if not is_feature_enabled("course.assessment_analytics", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="Student analytics visibility is disabled")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    assessment_analytics = get_assessment_analytics_from_db(course_id, assessment_id)
    return {"assessment_analytics": assessment_analytics}

@router.get("/{course_id}/assessments/{assessment_id}/frequencies")
async def get_assessment_frequencies(course_id: int, assessment_id: int, user_id: int = Query(...)):
    verified = await verifyRoleInCourse(user_id, course_id)
    role = verified.get("role")

    if role == "instructor":
        pass
    elif role == "ta":
        if not is_feature_enabled("course.ta_analytics_visibility", {"course_id": course_id, "user_id": user_id, "role": role}):
            raise HTTPException(status_code=403, detail="TA analytics visibility is disabled")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    frequencies = get_assessment_frequencies_from_db(course_id, assessment_id)
        
    return {"frequencies": frequencies}

@router.get("/system/overview")
async def get_system_overview(user_id: int = Query(...)):
    verified = await verifyAdmin(user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    overview = get_system_overview_from_db()
    
    return {"overview": overview}