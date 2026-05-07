import logging
import time
from fastapi import FastAPI, Request
from routes.courses import router as courses_router
from routes.roles import router as roles_router
from routes.users import router as users_router
from routes.verify import router as verify_router
from routes.admin_routes import router as admin_router

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

app.include_router(courses_router)
app.include_router(roles_router)
app.include_router(users_router)
app.include_router(verify_router)
app.include_router(admin_router)