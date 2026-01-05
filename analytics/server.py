from fastapi import FastAPI
from routes.assessments import router as assessments_router

app = FastAPI()

app.include_router(assessments_router)