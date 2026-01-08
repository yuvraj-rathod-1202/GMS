from fastapi import APIRouter, Depends, HTTPException, Query
import httpx, os
from dotenv import load_dotenv
from utils.auth import verify_token

router = APIRouter()
load_dotenv()

ANALYTICS_SERVICE_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://localhost:7000")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.get("/{course_id}/analytics/overview")
async def get_course_analytics_overview(course_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{ANALYTICS_SERVICE_URL}/{course_id}/analytics/overview",
                params={"user_id": user_info["user_id"]}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve course analytics overview")
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Analytics Service: {str(e)}"
            )
        
@router.get("/{course_id}/assessments/{assessment_id}/analytics")
async def get_assessment_analytics(course_id: int, assessment_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{ANALYTICS_SERVICE_URL}/{course_id}/assessments/{assessment_id}/analytics",
                params={"user_id": user_info["user_id"]}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve assessment analytics")
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Analytics Service: {str(e)}"
            )
            
@router.get("/{course_id}/assessments/{assessment_id}/ranges")
async def get_assessment_ranges(course_id: int, assessment_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{ANALYTICS_SERVICE_URL}/{course_id}/assessments/{assessment_id}/ranges",
                params={"user_id": user_info["user_id"]}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve assessment ranges")
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Analytics Service: {str(e)}"
            )
            
@router.get("/{course_id}/assessments/{assessment_id}/frequencies")
async def get_assessment_frequencies(course_id: int, assessment_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{ANALYTICS_SERVICE_URL}/{course_id}/assessments/{assessment_id}/frequencies",
                params={"user_id": user_info["user_id"]}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve assessment frequencies")
                )
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Analytics Service: {str(e)}"
            )
            
