from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import httpx, os
from dotenv import load_dotenv
from utils.auth import verify_token
from models.schema import GetAllCourseRoleRequest

load_dotenv()

router = APIRouter()

COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")

@router.get("/user/{course_id}/roles")
async def get_user_roles(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{COURSES_SERVICE_URL}/user/{course_id}/roles",
            params={
                "user_email": user_info.get("email"),
            }
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch user roles"
            )
        
        role = response.json()
        return {"course_id": course_id, "role": role}
    
@router.get("/me/courses")
async def get_user_courses(data: GetAllCourseRoleRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{COURSES_SERVICE_URL}/me/courses",
            params={**data.dict(), "user_email": user_info.get("email")},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch user courses"
            )
        
        courses = response.json()
        return courses

@router.get("me/courses?roles={role}")
async def get_user_courses_by_role(role: str, data: GetAllCourseRoleRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{COURSES_SERVICE_URL}/me/courses?roles={role}",
            params={**data.dict(), "user_email": user_info.get("email")},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch user courses by role"
            )
        
        courses = response.json()
        return courses