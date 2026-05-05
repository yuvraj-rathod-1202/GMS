import os, logging, time
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from models.schema import FeedbackRequest, SignUpUser, ChangePasswordRequest, ForgotPasswordRequest, BulkEnrollStudentRequest, InstructorResetPasswordRequest
from utils.security import verify_jwt_token
from utils.auth import verifyInstructorOrTa
from services.auth import login_user, signup_user, bulk_signup_users, change_user_password, forgot_user_password, submit_user_feedback, instructor_reset_user_password, get_all_users

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

app = FastAPI()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Get client IP (consider X-Forwarded-For for proxies)
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    
    # Log incoming request
    logger.info(f"Incoming request from IP: {client_ip} | Method: {request.method} | Path: {request.url.path}")
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log response
    logger.info(f"Request completed | IP: {client_ip} | Status: {response.status_code} | Duration: {process_time:.3f}s")
    
    return response

basic_auth = HTTPBasic()
bearer_auth = HTTPBearer()
    
@app.post("/login")
def login(credentials: HTTPBasicCredentials = Depends(basic_auth)):
    return login_user(credentials.username, credentials.password)

@app.post("/verify-token")
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_auth)):
    return verify_jwt_token(credentials)
        
@app.post("/signup")
def signup(user: SignUpUser, credentials: HTTPBasicCredentials = Depends(basic_auth)):
    return signup_user(user, credentials.password)
        
@app.post("/signup/bulk")
def bulk_signup(data: BulkEnrollStudentRequest):
    return bulk_signup_users(data)

@app.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_auth)):
    # token blacklisting can be implemented here
    return {"text": "Logged out successfully"}

@app.put("/change-password")
def change_password(data: ChangePasswordRequest):
    # macth old password with current password in db
    return change_user_password(data)

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    return forgot_user_password(data)

@app.post("/feedback")
def submit_feedback(feedback: FeedbackRequest):
    return submit_user_feedback(feedback, feedback.user_id)

@app.post("/instructor/reset-password")
async def instructor_reset_password(data: InstructorResetPasswordRequest):
    verified = await verifyInstructorOrTa(data.user_id)
    if not verified:
        raise HTTPException(
            status_code=403,
            detail="Instructor or TA privileges required"
        )
    return instructor_reset_user_password(data.target_user_id, data.new_password)

@app.get("/users")
def get_users(limit: int = 50, offset: int = 0):
    return get_all_users(limit, offset)