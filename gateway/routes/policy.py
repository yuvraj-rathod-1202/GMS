from fastapi import APIRouter, Depends, HTTPException, Query, Request
import httpx, os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.auth import verify_token
from models.schema import CreatePolicyRequest, UpdatePolicyRequest, CreatePolicyComponentRequest, UpdatePolicyComponentRequest, AssignPolicyRequest

load_dotenv()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

POLICY_SERVICE_URL = os.getenv("POLICY_SERVICE_URL", "http://localhost:7070")

def _error_detail(response, default_msg: str) -> str:
    try:
        data = response.json()
        return data.get("detail", default_msg)
    except Exception:
        text = (response.text or "").strip()
        return text or default_msg

@router.post("/{course_id}/policy")
@limiter.limit("100/minute")
async def create_policy(request: Request, course_id: int, data: CreatePolicyRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy",
                json={**data.model_dump(), "set_by_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to create policy"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
            
@router.get("/{course_id}/policy")
@limiter.limit("100/minute")
async def get_policy(request: Request, course_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve policy"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
           
@router.get("/{course_id}/policy/{policy_id}")
async def get_policy_by_id(course_id: int, policy_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve policy by ID"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
 
@router.delete("/{course_id}/policy/{policy_id}")
async def delete_policy(course_id: int, policy_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to delete policy"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
            
@router.put("/{course_id}/policy")
async def update_policy(course_id: int, data: UpdatePolicyRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy",
                json={**data.model_dump(), "updated_by_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to update policy"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
            
@router.delete("/{course_id}/policy/{policy_id}/components/{component_id}")
async def delete_policy_component(course_id: int, policy_id: int, component_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}/components/{component_id}",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to delete policy component"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.post("/{course_id}/policy/{policy_id}/components")
async def add_policy_component(course_id: int, policy_id: int, data: CreatePolicyComponentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}/components",
                json={**data.model_dump(), "added_by_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to add policy component"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )                  
          
@router.put("/{course_id}/policy/{policy_id}/components/{component_id}")
async def update_policy_component(course_id: int, policy_id: int, component_id: int, data: UpdatePolicyComponentRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}/components/{component_id}",
                json={**data.model_dump(), "updated_by_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to update policy component"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.post("/{course_id}/policy-assignments")
async def assign_policy_to_students(course_id: int, data: AssignPolicyRequest, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy-assignments",
                json={**data.model_dump(), "assigned_by_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to assign policy to students"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.get("/{course_id}/policy-assignments")
async def get_policy_assignments(course_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy-assignments",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve policy assignments"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.put("/{course_id}/policy/{policy_id}/default")
async def set_policy_as_default(course_id: int, policy_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/{policy_id}/default",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to set policy as default"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

@router.post("/{course_id}/policy/recalculate")
async def recalculate_policy(course_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/policy/recalculate",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to recalculate policy"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
            
@router.get("/{course_id}/total")
async def get_total_scores_of_all_students(course_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/total",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve total scores"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )
            
@router.get("/{course_id}/total/{student_id}")
async def get_total_score_of_student(course_id: int, student_id: int, user_info: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POLICY_SERVICE_URL}/courses/{course_id}/total/{student_id}",
                params={"user_id": user_info["user_id"]},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=_error_detail(response, "Failed to retrieve student's total score"),
                )
                
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to Policy Service: {str(e)}",
            )

