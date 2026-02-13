import os, logging
from fastapi import FastAPI, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from models.schema import FeedbackRequest, SignUpUser, ChangePasswordRequest, ForgotPasswordRequest, BulkEnrollStudentRequest
from utils.security import verify_jwt_token
from services.auth import login_user, signup_user, bulk_signup_users, change_user_password, forgot_user_password, submit_user_feedback

load_dotenv()

app = FastAPI()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

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