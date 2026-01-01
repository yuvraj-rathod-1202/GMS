import os
from fastapi import HTTPException, status
import httpx
from dotenv import load_dotenv

load_dotenv()

async def verifyInstructor(user_id: int, course_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('COURSE_SERVICE_URL')}/verifyinstructor",
                params={"user_id": user_id, "course_id": course_id}
            )
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Instructor privileges required"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error verifying instructor status"
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Course service unavailable: {str(e)}"
            )

async def verifyInstructorOrTa(user_id: int, course_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('COURSE_SERVICE_URL')}/verifyinstructororta",
                params={"user_id": user_id, "course_id": course_id}
            )
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Instructor or TA privileges required"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error verifying instructor/TA status"
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
                f"{os.getenv('COURSE_SERVICE_URL')}/verifyroleincourse",
                params={"user_id": user_id, "course_id": course_id}
            )
            if response.status_code == 200:
                return True
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have a role in the course"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error verifying role in course"
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Course service unavailable: {str(e)}"
            )