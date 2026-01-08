from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.users import router as users_router
from routes.assessments import router as assessments_router
from routes.policy import router as policy_router

app = FastAPI()
app.include_router(auth_router, prefix="/auth")
app.include_router(courses_router, prefix="/courses")
app.include_router(users_router, prefix="/courses/users")
app.include_router(assessments_router, prefix="/assessments")
app.include_router(policy_router, prefix="/courses")