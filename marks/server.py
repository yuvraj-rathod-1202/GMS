from fastapi import FastAPI
from routes.marks import router as  marks_router
from routes.assessments import router as assessments_router

app = FastAPI()

app.include_router(marks_router)
app.include_router(assessments_router)