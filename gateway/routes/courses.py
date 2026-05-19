from fastapi import APIRouter, Depends, HTTPException, Query, Request
import httpx, os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.auth import verify_token
from models.schema import AddCourseRequest, UpdateCourseStatusRequest, EnrollStudentRequest, EnrollTaRequest, EnrollInstructorRequest, CreateAssessmentRequest

load_dotenv()

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")
MARKS_SERVICE_URL = os.getenv("MARKS_SERVICE_URL", "http://localhost:6000")
POLICY_SERVICE_URL = os.getenv("POLICY_SERVICE_URL", "http://localhost:7070")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.get("/")
@router.get("")
@limiter.limit("100/minute")
async def get_courses(request: Request, limit: int = 50, offset: int = 0, search: str = None, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            params = {
                "user_id": user_info.get("user_id", 0),
                "limit": limit,
                "offset": offset
            }
            if search:
                params["search"] = search
            response = await client.get(
                f"{COURSES_SERVICE_URL}/all",
                params=params
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching courses"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )

@router.get("/enrollments/all")
async def get_all_enrollments(limit: int = 50, offset: int = 0, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/enrollments/all",
                params={
                    "user_id": user_info.get("user_id", 0),
                    "limit": limit,
                    "offset": offset
                }
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching enrollments"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )

@router.post("/")
@limiter.limit("100/minute")
async def create_course(request: Request, course: AddCourseRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/",
                json={**course.model_dump(), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code not in (200, 201):
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error creating course"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.get("/assessment-categories")
async def get_assessment_categories():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{POLICY_SERVICE_URL}/assessment-categories")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve assessment categories"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.get("/{course_id}")
async def get_course(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/id/{course_id}",
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching course"),
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
                f"{COURSES_SERVICE_URL}/id/{course_id}",
                json={**data.model_dump(exclude_unset=True), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error updating course"),
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
                f"{COURSES_SERVICE_URL}/id/{course_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error deleting course"),
                )
            return {"detail": "Course deleted successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/roles/{role}")
async def get_course_role(course_id: str, role: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            params = {}
            if role:
                params["role"] = role
            params["user_id"] = user_info.get("user_id", 0)
            
            response = await client.get(
                f"{COURSES_SERVICE_URL}/id/{course_id}/roles/{role}",
                params=params
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching course role"),
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
                json={**data.model_dump(), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error enrolling in course"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/enroll/bulk")
async def enroll_multiple_in_course(course_id: str, data: list[EnrollStudentRequest], user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/{course_id}/enroll/bulk",
                json={"students": [d.model_dump() for d in data], "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error enrolling multiple students in course"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/unenroll/all")
async def unenroll_multiple_from_course(course_id: str, user_info: dict = Depends(verify_token)):
    user_id = user_info.get("user_id", 0)
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # First fetch current students before unenrolling
            roles_response = await client.get(
                f"{COURSES_SERVICE_URL}/id/{course_id}/roles/student",
                params={"user_id": user_id, "role": "student"}
            )
            student_ids = []
            if roles_response.status_code == 200:
                roles_data = roles_response.json()
                student_ids = [s.get("user_id") for s in roles_data if s.get("user_id")]

            # Unenroll all students
            response = await client.post(
                f"{COURSES_SERVICE_URL}/{course_id}/unenroll/all",
                json={"user_id": user_id},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error unenrolling multiple students from course"),
                )

            # Cleanup marks and policy data for each student (best-effort)
            for sid in student_ids:
                try:
                    await client.delete(
                        f"{MARKS_SERVICE_URL}/{course_id}/student/{sid}/data",
                        params={"user_id": user_id}
                    )
                except Exception:
                    pass
                try:
                    await client.delete(
                        f"{POLICY_SERVICE_URL}/{course_id}/student/{sid}/data",
                        params={"user_id": user_id}
                    )
                except Exception:
                    pass

            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/enroll")
async def unenroll_from_course(course_id: str, student_id: int = Query(...), user_info: dict = Depends(verify_token)):
    user_id = user_info.get("user_id", 0)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/enroll",
                params={"student_id": student_id, "user_id": user_id},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error unenrolling from course"),
                )

            # Cleanup marks and policy data for this student (best-effort)
            try:
                await client.delete(
                    f"{MARKS_SERVICE_URL}/{course_id}/student/{student_id}/data",
                    params={"user_id": user_id}
                )
            except Exception:
                pass
            try:
                await client.delete(
                    f"{POLICY_SERVICE_URL}/{course_id}/student/{student_id}/data",
                    params={"user_id": user_id}
                )
            except Exception:
                pass

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
                json={**data.model_dump(), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error adding TA to course"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/tas")
async def remove_ta_from_course(course_id: str, ta_id: int = Query(...), user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/tas",
                params={"ta_id": ta_id, "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error removing TA from course"),
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
                json={**data.model_dump(), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error adding instructor to course"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/instructors")
async def remove_instructor_from_course(course_id: str, instructor_id: int = Query(...), user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/{course_id}/instructors",
                params={"instructor_id": instructor_id, "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error removing instructor from course"),
                )
            return {"detail": "Instructor removed from course successfully"}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}"
            )

@router.post("/{course_id}/assessments")
async def create_assessment(course_id: str, data: CreateAssessmentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            payload = data.model_dump(mode='json')
            
            response = await client.post(
                f"{MARKS_SERVICE_URL}/{course_id}/assessments",
                json={**payload, "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code not in (200, 201):
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error creating assessment"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/assessments")
async def get_all_assessments(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/{course_id}/assessments",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching assessments"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/marks/{student_id}")
async def get_student_marks(course_id: str, student_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/{course_id}/marks/all/{student_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching student marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/all/assessment/marks")
async def get_all_marks(course_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/{course_id}/all/assessment/marks",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching all marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )

