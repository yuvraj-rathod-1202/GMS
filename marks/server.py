import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes.marks import router as  marks_router
from routes.assessments import router as assessments_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(marks_router)
app.include_router(assessments_router)