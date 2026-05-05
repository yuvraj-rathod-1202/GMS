import base64
from utils.security import create_jwt_token
from models.schema import User
import os

def get_basic_auth_headers(username, password):
    """Helper to generate HTTP Basic Auth headers."""
    auth_str = f"{username}:{password}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()
    return {"Authorization": f"Basic {b64_auth_str}"}

def get_bearer_token_headers(user_id, email="test@example.com"):
    """Helper to generate a valid Bearer token for testing."""
    token = create_jwt_token(User(id=user_id, email=email), os.getenv("JWT_SECRET_KEY") or "default")
    return {"Authorization": f"Bearer {token}"}
