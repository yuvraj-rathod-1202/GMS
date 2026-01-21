from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.users import router as users_router
from routes.assessments import router as assessments_router
from routes.policy import router as policy_router
from routes.analytics import router as analytics_router

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://mms.com",
    "https://mms.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

app.include_router(auth_router, prefix="/auth")
app.include_router(courses_router, prefix="/courses")
app.include_router(users_router, prefix="/courses/users")
app.include_router(assessments_router, prefix="/assessments")
app.include_router(policy_router, prefix="/courses")
app.include_router(analytics_router, prefix="/courses")