from fastapi import APIRouter, HTTPException, status
from utils.auth import verifyAdmin, verifyRoleInCourse, verifyInstructorOrTa, verifyInstructor

router = APIRouter()

@router.get("/verifyadmin")
async def verify_admin_endpoint(user_id: int):
    try:
        verifyAdmin(user_id)
        return {"success": True}
    except HTTPException as e:
        raise e
    
@router.get("/verifyinstructor")
async def verify_instructor_endpoint(user_id: int, course_id: int):
    try:
        verifyInstructor(user_id, course_id)
        return {"success": True}
    except HTTPException as e:
        raise e
    
@router.get("/verifyinstructororta")
async def verify_instructor_or_ta_endpoint(user_id: int, course_id: int):
    try:
        verifyInstructorOrTa(user_id, course_id)
        return {"success": True}
    except HTTPException as e:
        raise e
    
@router.get("/verifyroleincourse")
async def verify_role_in_course_endpoint(user_id: int, course_id: int):
    try:
        role = verifyRoleInCourse(user_id, course_id)
        return {"success": True, "role": f"{role}"}
    except HTTPException as e:
        raise e