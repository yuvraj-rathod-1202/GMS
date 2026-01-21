import os
from fastapi import HTTPException, status
import httpx
from dotenv import load_dotenv

load_dotenv()

COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

async def verifyInstructor(user_id: int, course_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/verifyinstructor",
                params={"user_id": user_id, "course_id": course_id}
            )
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=_error_detail(response, "Instructor privileges required")
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error verifying instructor status")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Course service unavailable: {str(e)}"
            )
            
async def verifyRoleInCourse(user_id: int, course_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/verifyroleincourse",
                params={"user_id": user_id, "course_id": course_id}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("role", None)
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=_error_detail(response, "Access denied")
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error verifying role in course")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Course service unavailable: {str(e)}"
            )