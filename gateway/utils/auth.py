import httpx, os
from dotenv import load_dotenv
from fastapi import HTTPException, Header
from typing import Optional

load_dotenv()

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:5000")

async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    async with httpx.AsyncClient() as client:
        # Verify token with auth service
        response = await client.post(
            f"{AUTH_SERVICE_URL}/verify-token",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        payload = response.json()
        user_id = payload.get("user_id")
        
        # Check if user is admin via courses service
        try:
            admin_resp = await client.get(
                f"{os.getenv('COURSES_SERVICE_URL', 'http://localhost:8080')}/verifyadmin",
                params={"user_id": user_id}
            )
            if admin_resp.status_code == 200:
                payload["role"] = "admin"
            else:
                # Default to student if not admin
                payload["role"] = "student"
        except Exception as e:
            # Fallback if courses service is down
            payload["role"] = "unknown"
            
        return payload