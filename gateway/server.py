from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.users import router as users_router
from routes.assessments import router as assessments_router
from routes.policy import router as policy_router
from routes.analytics import router as analytics_router

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(courses_router, prefix="/courses")
app.include_router(users_router, prefix="/courses/users")
app.include_router(assessments_router, prefix="/assessments")
app.include_router(policy_router, prefix="/courses")
app.include_router(analytics_router, prefix="/courses")