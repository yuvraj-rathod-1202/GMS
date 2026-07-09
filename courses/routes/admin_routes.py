from idna import package_data
from fastapi import APIRouter, HTTPException, status, Query
from utils.auth import verifyAdmin
from models.schemas.admin import AdminRequest
from services.admin import add_admin, remove_admin, get_all_admins


router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/{user_id}")
async def promote_to_admin(user_id: int, data: AdminRequest):
    verified = verifyAdmin(data.user_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return add_admin(user_id)

@router.delete("/{user_id}")
async def demote_from_admin(user_id: int, admin_id: int = Query(...)):
    verified = verifyAdmin(admin_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return remove_admin(user_id)

@router.get("/all")
async def fetch_all_admins(admin_id: int = Query(...)):
    verified = verifyAdmin(admin_id)
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return get_all_admins()
