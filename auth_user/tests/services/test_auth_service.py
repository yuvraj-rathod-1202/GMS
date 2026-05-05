import pytest
from fastapi import HTTPException
from services.auth import login_user, signup_user, change_user_password
from models.schema import SignUpUser, ChangePasswordRequest
from utils.security import create_jwt_token
import bcrypt

def _hash_for_test(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def test_login_user_success(mock_db):
    hashed_pw = _hash_for_test("mypassword")
    mock_db.set_fetchone_result((1, "test@test.com", hashed_pw))
    
    result = login_user("1", "mypassword")
    
    assert "token" in result
    assert result["user"]["id"] == 1
    assert result["user"]["email"] == "test@test.com"
    queries = mock_db.get_queries()
    assert "SELECT id, email, password_hash FROM users WHERE id =" in queries[0][0]

def test_login_user_invalid_password(mock_db):
    hashed_pw = _hash_for_test("mypassword")
    mock_db.set_fetchone_result((1, "test@test.com", hashed_pw))
    
    with pytest.raises(HTTPException) as exc:
        login_user("1", "wrongpassword")
        
    assert exc.value.status_code == 401
    assert "Invalid credentials" in exc.value.detail

def test_login_user_not_found(mock_db):
    mock_db.set_fetchone_result(None) # User not found
    
    with pytest.raises(HTTPException) as exc:
        login_user("1", "mypassword")
        
    assert exc.value.status_code == 401
    assert "Invalid credentials" in exc.value.detail

def test_signup_user_success(mock_db):
    mock_db.set_fetchone_result(None) # No existing user
    user = SignUpUser(id=1, email="new@test.com", password="pwd")
    
    result = signup_user(user, "pwd")
    
    assert mock_db.committed is True
    queries = mock_db.get_queries()
    assert len(queries) == 2
    assert "INSERT INTO users" in queries[1][0]
    assert "new@test.com" in queries[1][1]

def test_signup_user_already_exists(mock_db):
    mock_db.set_fetchone_result((1,)) # Existing user found
    user = SignUpUser(id=1, email="new@test.com", password="pwd")
    
    with pytest.raises(HTTPException) as exc:
        signup_user(user, "pwd")
        
    assert exc.value.status_code == 400
    assert "Email already registered" in exc.value.detail

def test_change_password_success(mock_db):
    hashed_old_pw = _hash_for_test("old_pass")
    mock_db.set_fetchone_result((hashed_old_pw,))
    
    req = ChangePasswordRequest(id=1, old_password="old_pass", new_password="new_pass")
    result = change_user_password(req)
    
    assert mock_db.committed is True
    assert "Password changed successfully" in result["text"]
