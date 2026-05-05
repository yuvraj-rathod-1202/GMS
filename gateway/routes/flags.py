from fastapi import APIRouter, Depends, HTTPException, Request, status
import httpx
import os
import MySQLdb
import json
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from utils.auth import verify_token
from utils.feature_flags import is_feature_enabled, get_all_flags, evaluator

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()
COURSES_SERVICE_URL = os.getenv("COURSES_SERVICE_URL", "http://localhost:8080")

def get_db():
    try:
        conn = MySQLdb.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "mms_user"),
            password=os.getenv("DB_PASSWORD", "MMS2026User"),
            db="feature_flags",
            port=int(os.getenv("DB_PORT", 3306))
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

# Utility to check if user is instructor for a course
async def verify_course_instructor(course_id: str, user_info: dict):
    if user_info.get("role") == "admin":
        return True
    
    user_id = user_info.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User identity not found in token")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{COURSES_SERVICE_URL}/verifyinstructor",
                params={
                    "user_id": user_id,
                    "course_id": course_id
                }
            )
            
            if response.status_code == 200:
                return True
            
            # If not 200, check the error detail
            try:
                error_detail = response.json().get("detail", "Instructor verification failed")
            except:
                error_detail = "Instructor verification failed"
                
            raise HTTPException(status_code=response.status_code, detail=error_detail)
            
        except httpx.RequestError as e:
            logger.error(f"Error connecting to courses service: {e}")
            raise HTTPException(status_code=503, detail="Courses service unavailable")

# --- Public API ---

@router.get("/api/flags", response_model=Dict[str, bool])
async def get_active_flags(course_id: Optional[str] = None, user_info: dict = Depends(verify_token)):
    context = {
        "user_id": str(user_info.get("user_id", "")),
        "role": user_info.get("role", ""),
        "course_id": course_id
    }
    return get_all_flags(context)

# --- Admin API (Definitions) ---

@router.get("/admin/flags/definitions")
async def list_definitions(user_info: dict = Depends(verify_token)):
    if user_info.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = db.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM feature_flag_definitions")
        return cursor.fetchall()
    finally:
        if db:
            db.close()

@router.post("/admin/flags/definitions")
async def create_definition(data: dict, user_info: dict = Depends(verify_token)):
    if user_info.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = db.cursor()
        query = """
            INSERT INTO feature_flag_definitions (name, description, type, scope_level, default_enabled, default_config)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data['name'], data.get('description'), data.get('type', 'boolean'),
            data.get('scope_level', 'global'), data.get('default_enabled', False),
            json.dumps(data.get('default_config', {}))
        ))
        db.commit()
        evaluator.refresh_definitions()
        return {"status": "success", "id": cursor.lastrowid}
    finally:
        if db:
            db.close()

# --- Instructor API (Overrides) ---

@router.get("/course/{course_id}/flags")
async def get_course_flags(course_id: str, user_info: dict = Depends(verify_token)):
    await verify_course_instructor(course_id, user_info)
    
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = db.cursor(MySQLdb.cursors.DictCursor)
        # Fetch all course-level flags and their overrides for this course
        query = """
            SELECT d.id, d.name, d.description, d.default_enabled, d.default_config,
                   o.enabled as override_enabled, o.config as override_config
            FROM feature_flag_definitions d
            LEFT JOIN feature_flag_overrides o ON d.id = o.flag_id AND o.scope_id = %s
            WHERE d.scope_level = 'course'
        """
        cursor.execute(query, (course_id,))
        return cursor.fetchall()
    finally:
        if db:
            db.close()

@router.post("/course/{course_id}/flags/{flag_name}/override")
async def set_course_override(course_id: str, flag_name: str, data: dict, user_info: dict = Depends(verify_token)):
    await verify_course_instructor(course_id, user_info)
    
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = db.cursor()
        # Find flag_id
        cursor.execute("SELECT id FROM feature_flag_definitions WHERE name = %s", (flag_name,))
        res = cursor.fetchone()
        if not res: raise HTTPException(status_code=404, detail="Flag definition not found")
        flag_id = res[0]
        
        query = """
            INSERT INTO feature_flag_overrides (flag_id, scope_id, enabled, config, updated_by)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                config = VALUES(config),
                updated_by = VALUES(updated_by)
        """
        cursor.execute(query, (
            flag_id, course_id, data['enabled'], 
            json.dumps(data.get('config', {})), str(user_info.get('user_id'))
        ))
        db.commit()
        return {"status": "success"}
    finally:
        if db:
            db.close()
