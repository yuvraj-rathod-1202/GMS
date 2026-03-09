import os, logging, datetime, bcrypt
from fastapi import HTTPException, status
from models.schema import User, BulkEnrollStudentRequest, ChangePasswordRequest, ForgotPasswordRequest, FeedbackRequest
from utils.security import create_jwt_token, verify_password
from utils.db import get_db
from models.schema import SignUpUser
from utils.email import request_password_reset
from dotenv import load_dotenv
from utils.security import verify_jwt_token

load_dotenv()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

DB_CONNECTION_ERROR = "Database connection error"
INVALID_CREDENTIALS = "Invalid credentials"


def _utcnow() -> datetime.datetime:
    return datetime.datetime.now(tz=datetime.timezone.utc)

def _hash_password(raw_password: str) -> str:
    return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _get_db_or_raise():
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=DB_CONNECTION_ERROR,
        )
    return db

def _handle_service_error(action: str, exc: Exception, public_message: str):
    logger.error(f"{action} error: {str(exc)}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=public_message if IS_PRODUCTION else f"{action} error: {str(exc)}",
    )

def login_user(username: str, password: str):
    db = _get_db_or_raise()
    try:
        cur = db.cursor()
        cur.execute(
            "SELECT id, email, password_hash FROM users WHERE id = %s",
            (username,)
        )
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=INVALID_CREDENTIALS,
            )
            
        id, email, password_hash = row
        if not verify_password(password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=INVALID_CREDENTIALS,
            )
            
        token = create_jwt_token(
            User(id=id, email=email),
            os.getenv("JWT_SECRET_KEY") or "default",
        )
        
        return {"token": token, "user": {"id": id, "email": email, "last_login": _utcnow()}}
    except Exception as e:
        _handle_service_error("Login", e, "An error occurred during login")
        
def signup_user(user: SignUpUser, password: str):
    db = _get_db_or_raise()
    try:    
        cur = db.cursor()
        cur.execute(
            "SELECT id FROM users WHERE id = %s",
            (user.id,)
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        password_hash = _hash_password(password)
        
        cur.execute(
            "INSERT INTO users (id, email, password_hash, last_login, created_at) VALUES (%s, %s, %s, %s, %s)",
            (user.id, user.email, password_hash, None, _utcnow())
        )
        db.commit()
        
        return {"User created successfully"}
    except Exception as e:
        _handle_service_error("Signup", e, "Failed to create user")
        
def bulk_signup_users(data: BulkEnrollStudentRequest):
    db = _get_db_or_raise()
    try:    
        cursor = db.cursor()

        user_ids = [user.id for user in data.users]
        if user_ids:
            placeholders = ','.join(['%s'] * len(user_ids))
            cursor.execute(f"SELECT id FROM users WHERE id IN ({placeholders})", user_ids)
            existing_ids = {row[0] for row in cursor.fetchall()}
        else:
            existing_ids = set()
        
        user_data = []
        for user in data.users:
            if user.id not in existing_ids:
                password_hash = bcrypt.hashpw(str(user.id).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                user_data.append((user.id, user.email, password_hash, None, _utcnow()))
        
        if user_data:
            cursor.executemany(
                "INSERT IGNORE INTO users (id, email, password_hash, last_login, created_at) VALUES (%s, %s, %s, %s, %s)",
                user_data
            )
            db.commit()
            return {"message": f"Created {len(user_data)} new users, {len(existing_ids)} already existed"}
        else:
            return {"message": "All users already exist"}
    except Exception as e:
        _handle_service_error("Bulk signup", e, "Failed to create users")
        
def change_user_password(data: ChangePasswordRequest):
    db = _get_db_or_raise()
    try:
        cur = db.cursor()
        cur.execute(
            "SELECT password_hash FROM users WHERE id = %s",
            (data.id,)
        )
        row = cur.fetchone()
        print(row)
        if not row or not verify_password(data.old_password, row[0]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid old password"
            )
            
        password_hash = _hash_password(data.new_password)
        
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (password_hash, data.id,)
        )
        db.commit()
        
        return {"text": "Password changed successfully"}
    
    except Exception as e:
        _handle_service_error("Change password", e, "Failed to change password")
        
def forgot_user_password(data: ForgotPasswordRequest):
    db = _get_db_or_raise()
    try:    
        cur = db.cursor()
        cur.execute(
            "SELECT id FROM users WHERE id = %s",
            (data.id,)
        )
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not registered"
            )
            
        err = request_password_reset(data.id)
        
        if err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email"
            )
        else:
            return {"text": "Password reset instructions sent"}
        
    except Exception as e:
        _handle_service_error("Forgot password", e, "Failed to process forgot password request")
        
def submit_user_feedback(data: FeedbackRequest, user_id: int):
    db = _get_db_or_raise()
    try:
        cur = db.cursor()
        cur.execute(
            "INSERT INTO feedback (user_id, feedback_text) VALUES (%s, %s)",
            (user_id, data.feedback_text)
        )
        db.commit()
        return {"text": "Feedback submitted successfully"}
    except Exception as e:
        _handle_service_error("Submit feedback", e, "Failed to submit feedback")

def instructor_reset_user_password(target_user_id: int, new_password: str):
    db = _get_db_or_raise()
    try:
        cur = db.cursor()
        cur.execute(
            "SELECT id FROM users WHERE id = %s",
            (target_user_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        password_hash = _hash_password(new_password)
        
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (password_hash, target_user_id,)
        )
        db.commit()
        
        return {"text": "Password reset successfully"}
    
    except Exception as e:
        _handle_service_error("Instructor reset password", e, "Failed to reset password")