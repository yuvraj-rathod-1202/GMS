from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import httpx, os
from dotenv import load_dotenv
from utils.auth import verify_token
from models.schema import AddCourseRequest, UpdateCourseStatusRequest, EnrollStudentRequest, EnrollTaRequest, EnrollInstructorRequest

load_dotenv()

router = APIRouter()

COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")

@router.get("/")
async def get_courses(user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/",
                params={
                    "email": user_info.get("email", "")
                } 
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error fetching courses",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/")
async def create_course(course: AddCourseRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/",
                json={**course.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code not in (200, 201):
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error creating course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}")
async def get_course(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/{course_id}",
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error fetching course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.put("/{course_id}")
async def update_course(course_id: str, data: UpdateCourseStatusRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{COURSES_SERVICE_URL}/{course_id}",
                json={**data.dict(exclude_unset=True), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error updating course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}")
async def delete_course(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}",
                params={"email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error deleting course",
                )
            return {"detail": "Course deleted successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/roles?role={role}")
async def get_course_role(course_id: str, role: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/{course_id}/roles?role={role}",
                params={
                    "email": user_info.get("email", "")
                } 
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error fetching course roles",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/enroll")
async def enroll_in_course(course_id: str, data: EnrollStudentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/{course_id}/enroll",
                json={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error enrolling in course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/enroll")
async def unenroll_from_course(course_id: str, data: EnrollStudentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/enroll",
                params={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error unenrolling from course",
                )
            return {"detail": "Unenrolled from course successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/tas")
async def add_ta_to_course(course_id: str, data: EnrollTaRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/{course_id}/tas",
                json={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error adding TA to course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/tas")
async def remove_ta_from_course(course_id: str, data: EnrollTaRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/tas",
                params={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error removing TA from course",
                )
            return {"detail": "TA removed from course successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/instructors")
async def add_instructor_to_course(course_id: str, data: EnrollInstructorRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/{course_id}/instructors",
                json={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error adding instructor to course",
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/instructors")
async def remove_instructor_from_course(course_id: str, data: EnrollInstructorRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/instructors",
                params={**data.dict(), "email": user_info.get("email", "")},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error removing instructor from course",
                )
            return {"detail": "Instructor removed from course successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )

