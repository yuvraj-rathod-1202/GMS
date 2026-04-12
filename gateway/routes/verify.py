from fastapi import APIRouter, Depends, HTTPException
import httpx
import os
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


@router.get("/verifyadmin")
async def verify_admin(user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/verifyadmin",
                params={"user_id": user_info.get("user_id", 0)},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Admin privileges required"),
                )

            return {"success": True, "isAdmin": True}
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Courses service unavailable: {str(e)}",
            )
