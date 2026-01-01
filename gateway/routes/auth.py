from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import httpx, os
from dotenv import load_dotenv
from models.schema import SignUpUser, ChangePasswordRequest, ForgotPasswordRequest
from utils.auth import verify_token

load_dotenv()

router = APIRouter()
basic_auth = HTTPBasic()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.post("/login")
async def login(credentials: HTTPBasicCredentials = Depends(basic_auth)):
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
async def signup(user: SignUpUser):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/signup",
                json=user.dict(),
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
async def change_password(data: ChangePasswordRequest):
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
async def forgot_password(data: ForgotPasswordRequest):
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