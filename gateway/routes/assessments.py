from fastapi import APIRouter, Depends, HTTPException, Request
import httpx, os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.auth import verify_token
from models.schema import UpdateAssessmentRequest, AddMarksRequest

load_dotenv()

MARKS_SERVICE_URL = os.getenv("MARKS_SERVICE_URL", "http://localhost:6000")

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.get("/{course_id}/{assessment_id}")
@limiter.limit("100/minute")
async def get_assessment(request: Request, course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/assessments/{course_id}/{assessment_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching assessment"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.put("/{course_id}/{assessment_id}")
@limiter.limit("100/minute")
async def update_assessment(request: Request, course_id: str, assessment_id: str, data: UpdateAssessmentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MARKS_SERVICE_URL}/assessments/{course_id}/{assessment_id}",
                json={**data.model_dump(mode='json', exclude_unset=True), "user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error updating assessment"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.delete("/{course_id}/{assessment_id}")
async def delete_assessment(course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MARKS_SERVICE_URL}/assessments/{course_id}/{assessment_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error deleting assessment"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.post("/{course_id}/{assessment_id}/marks")
async def add_marks(course_id: str, assessment_id: str, data: AddMarksRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/marks",
                json={**data.model_dump(mode='json'), "recorded_by_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error adding marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/{assessment_id}/marks")
async def get_marks(course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/marks",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error fetching marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.get("/{course_id}/{assessment_id}/marks/{student_id}")
async def get_student_marks(course_id: str, assessment_id: str, student_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/marks/{student_id}",
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
            
@router.delete("/{course_id}/{assessment_id}/marks/{student_id}")
async def delete_student_marks(course_id: str, assessment_id: str, student_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/marks/{student_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error deleting student marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.put("/{course_id}/{assessment_id}/publish")
async def publish_assessment_marks(course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/publish",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error publishing marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )
            
@router.put("/{course_id}/{assessment_id}/unpublish")
async def unpublish_assessment_marks(course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{MARKS_SERVICE_URL}/{course_id}/{assessment_id}/unpublish",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error unpublishing marks"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )

@router.get("/all", dependencies=[Depends(verify_token)])
async def get_all_assessments(request: Request, limit: int = 50, offset: int = 0, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MARKS_SERVICE_URL}/assessments/all",
                params={"limit": limit, "offset": offset, "user_id": user_info.get("user_id", 0)}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to fetch all assessments")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )

@router.delete("/{course_id}/{assessment_id}")
async def delete_assessment(course_id: str, assessment_id: str, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{MARKS_SERVICE_URL}/assessments/{course_id}/{assessment_id}",
                params={"user_id": user_info.get("user_id", 0)},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Error deleting assessment"),
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Marks service unavailable: {str(e)}"
            )

