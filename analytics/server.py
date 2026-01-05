import pika, sys, os
from fastapi import FastAPI
from dotenv import load_dotenv
from routes.assessments import router as assessments_router

app = FastAPI()

app.include_router(assessments_router)

