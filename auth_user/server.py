import datetime, os, bcrypt, logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from models.schema import User, SignUpUser, ChangePasswordRequest, ForgotPasswordRequest
from utils.security import create_jwt_token, verify_jwt_token, verify_password
from utils.email import request_password_reset
from utils.db import get_db

load_dotenv()

app = FastAPI()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

basic_auth = HTTPBasic()
bearer_auth = HTTPBearer()
    
@app.post("/login")
def login(credentials: HTTPBasicCredentials = Depends(basic_auth)):
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:    
        cur = db.cursor()
        cur.execute(
            "SELECT id, email, password_hash FROM users WHERE id = %s",
            (credentials.username,)
        )
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
        id, email, password_hash = row
        if not verify_password(credentials.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
        token = create_jwt_token(
            User(id=id, email=email),
            os.getenv("JWT_SECRET_KEY") or "default",
        )
        
        return {"token": token, "user": {"id": id, "email": email, "last_login": datetime.datetime.now(tz=datetime.timezone.utc)}}
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login" if IS_PRODUCTION else f"Login error: {str(e)}"
        )

@app.post("/verify-token")
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_auth)):
    return verify_jwt_token(credentials)
        
@app.post("/signup")
def signup(user: SignUpUser, credentials: HTTPBasicCredentials = Depends(basic_auth)):
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
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
            
        password_hash = bcrypt.hashpw(credentials.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "INSERT INTO users (id, email, password_hash, last_login, created_at) VALUES (%s, %s, %s, %s, %s)",
            (user.id, user.email, password_hash, None, datetime.datetime.now(tz=datetime.timezone.utc))
        )
        db.commit()
        
        return {"User created successfully"}
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user" if IS_PRODUCTION else f"Signup error: {str(e)}"
        )
        
@app.post("/signup/bulk")
def bulk_signup(users: list[SignUpUser]):
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:    
        cursor = db.cursor()
        user_data = []
        for user in users:
            password_hash = bcrypt.hashpw(str(user.id).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_data.append((user.id, user.email, password_hash, None, datetime.datetime.now(tz=datetime.timezone.utc)))
            
        cursor.executemany(
            "INSERT IGNORE INTO users (id, email, password_hash, last_login, created_at) VALUES (%s, %s, %s, %s, %s)",
            user_data
        )
        db.commit()
        return {"text": "Users created successfully"}
    except Exception as e:
        logger.error(f"Bulk signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create users" if IS_PRODUCTION else f"Bulk signup error: {str(e)}"
        )

@app.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_auth)):
    # token blacklisting can be implemented here
    return {"text": "Logged out successfully"}

@app.put("/change-password")
def change_password(data: ChangePasswordRequest):
    # macth old password with current password in db
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
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
            
        password_hash = bcrypt.hashpw(data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (password_hash, data.id,)
        )
        db.commit()
        
        return {"text": "Password changed successfully"}
    
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password" if IS_PRODUCTION else f"Change password error: {str(e)}"
        )

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    db = get_db()
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
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
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process forgot password request" if IS_PRODUCTION else f"Forgot password error: {str(e)}"
        )
