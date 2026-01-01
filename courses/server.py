from fastapi import FastAPI
from routes.courses import router as courses_router
from routes.roles import router as roles_router
from routes.users import router as users_router
from routes.verify import router as verify_router

app = FastAPI()

app.include_router(courses_router)
app.include_router(roles_router)
app.include_router(users_router)
app.include_router(verify_router)