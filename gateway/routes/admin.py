from fastapi import APIRouter, Depends, HTTPException, Request
import httpx, os
from dotenv import load_dotenv
from utils.auth import verify_token

load_dotenv()

router = APIRouter()

COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.post("/{user_id}", dependencies=[Depends(verify_token)])
async def promote_to_admin(user_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{COURSES_SERVICE_URL}/admin/{user_id}",
                json={"user_id": user_info.get("user_id")}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to promote user")
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Courses service unavailable: {str(e)}")

@router.delete("/{user_id}", dependencies=[Depends(verify_token)])
async def demote_from_admin(user_id: int, user_info: dict = Depends(verify_token)):    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{COURSES_SERVICE_URL}/admin/{user_id}",
                params={"admin_id": user_info.get("user_id")}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to demote user")
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Courses service unavailable: {str(e)}")

@router.get("/all", dependencies=[Depends(verify_token)])
async def fetch_all_admins(user_info: dict = Depends(verify_token)):    
    async with httpx.AsyncClient() as client:
        try:
            # 1. Get admin IDs from courses service
            response = await client.get(
                f"{COURSES_SERVICE_URL}/admin/all",
                params={"admin_id": user_info.get("user_id")}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to fetch admin IDs")
                )
            
            admin_ids = response.json().get("admins", [])
            if not admin_ids:
                return {"admins": []}

            # 2. Get details for these admins from auth service
            AUTH_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")
            users_resp = await client.post(f"{AUTH_URL}/users/batch", json=admin_ids)
            if users_resp.status_code != 200:
                # If batch fetch fails, return just the IDs as a fallback, but we should try to show details
                return response.json()
            
            return users_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
