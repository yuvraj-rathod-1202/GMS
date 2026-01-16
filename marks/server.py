from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.marks import router as  marks_router
from routes.assessments import router as assessments_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(marks_router)
app.include_router(assessments_router)