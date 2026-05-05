from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import httpx, os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schema import SignUpUser, ChangePasswordRequest, ForgotPasswordRequest, FeedbackRequest, InstructorResetPasswordRequest
from utils.auth import verify_token

load_dotenv()

router = APIRouter()
basic_auth = HTTPBasic()
limiter = Limiter(key_func=get_remote_address)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: HTTPBasicCredentials = Depends(basic_auth)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/login",
                auth=(credentials.username, credentials.password)
            )
            
            if response.status_code == 200:
                try:
                    return response.json()
                except Exception:
                    return {"text": response.text}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Authentication failed")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service unavailable: {str(e)}"
            )

@router.post("/signup")
async def signup(request: Request, user: SignUpUser):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/signup",
                json=user.model_dump(),
                auth=(str(user.id), user.password)
            )
            
            if response.status_code in (200, 201):
                try:
                    return response.json()
                except Exception:
                    return {"text": response.text or "Signup succeeded"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Signup failed")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service unavailable: {str(e)}"
            )
            
@router.post("/logout", dependencies=[Depends(verify_token)])
async def logout(credentials: HTTPBasicCredentials = Depends(basic_auth)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/logout",
                auth=(credentials.username, credentials.password)
            )
            
            if response.status_code == 200:
                return {"text": "Logged out successfully"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Logout failed")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service unavailable: {str(e)}"
            )
            
@router.post("/change-password", dependencies=[Depends(verify_token)])
@limiter.limit("5/minute")
async def change_password(request: Request, data: ChangePasswordRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{AUTH_SERVICE_URL}/change-password",
                json={"old_password": data.old_password, "new_password": data.new_password, "id": data.id},
            )
            
            if response.status_code == 200:
                return {"text": "Password changed successfully"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Password change failed")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service unavailable: {str(e)}"
            )
            
@router.post("/forgot-password", dependencies=[Depends(verify_token)])
@limiter.limit("3/hour")
async def forgot_password(request: Request, data: ForgotPasswordRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/forgot-password",
                json={"id": data.id}
            )
            
            if response.status_code == 200:
                return {"text": "Password reset link sent"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Forgot password failed")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service unavailable: {str(e)}"
            )
            
@router.post("/feedback")
@limiter.limit("10/hour")
async def submit_feedback(request: Request, data: FeedbackRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/feedback",
                json={"feedback_text": data.feedback_text, "user_id": data.user_id or 11111111}
            )
            if response.status_code == 200:
                return {"text": "Feedback submitted successfully"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to submit feedback")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service Error: {str(e)}"
            )
            
@router.post("/instructor/reset-password", dependencies=[Depends(verify_token)])
@limiter.limit("20/hour")
async def instructor_reset_password(request: Request, data: InstructorResetPasswordRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/instructor/reset-password",
                json={"user_id": user_info.get("user_id", ""), "target_user_id": data.target_user_id, "new_password": data.new_password},
            )
            if response.status_code == 200:
                return {"text": "Password reset successfully"}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to reset password")
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Auth service Error: {str(e)}"
            )