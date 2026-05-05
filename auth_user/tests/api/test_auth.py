import pytest
from tests.base import get_basic_auth_headers, get_bearer_token_headers
import bcrypt

def _hash_for_test(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def test_login_endpoint_success(client, mock_db):
    hashed_pw = _hash_for_test("mypassword")
    mock_db.set_fetchone_result((1, "test@test.com", hashed_pw))
    
    headers = get_basic_auth_headers("1", "mypassword")
    response = client.post("/login", headers=headers)
    
    assert response.status_code == 200
    assert "token" in response.json()
    assert response.json()["user"]["email"] == "test@test.com"

def test_login_endpoint_unauthorized(client, mock_db):
    mock_db.set_fetchone_result(None) # Not found
    
    headers = get_basic_auth_headers("1", "wrong_password")
    response = client.post("/login", headers=headers)
    
    assert response.status_code == 401

def test_signup_endpoint_success(client, mock_db):
    mock_db.set_fetchone_result(None) # DB check passes, no existing user
    
    headers = get_basic_auth_headers("1", "mypassword")
    payload = {
        "id": 1,
        "email": "newuser@test.com",
        "password": "mypassword"
    }
    response = client.post("/signup", json=payload, headers=headers)
    
    assert response.status_code == 200
    assert "User created successfully" in response.json()

def test_verify_token_endpoint(client, mock_db):
    headers = get_bearer_token_headers(user_id=1, email="test@test.com")
    response = client.post("/verify-token", headers=headers)
    
    assert response.status_code == 200
    assert response.json()["user_id"] == 1
    assert response.json()["email"] == "test@test.com"

def test_logout_endpoint(client, mock_db):
    headers = get_bearer_token_headers(user_id=1)
    response = client.post("/logout", headers=headers)
    
    assert response.status_code == 200
    assert response.json()["text"] == "Logged out successfully"
