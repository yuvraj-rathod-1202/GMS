import pytest
from unittest.mock import patch
import bcrypt

def _hash_for_test(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def test_change_password_endpoint(client, mock_db):
    hashed_pw = _hash_for_test("old_pass")
    mock_db.set_fetchone_result((hashed_pw,))
    
    payload = {
        "id": 1,
        "old_password": "old_pass",
        "new_password": "new_pass"
    }
    response = client.put("/change-password", json=payload)
    
    assert response.status_code == 200
    assert response.json()["text"] == "Password changed successfully"

@patch('services.auth.request_password_reset')
def test_forgot_password_endpoint(mock_request_reset, client, mock_db):
    mock_db.set_fetchone_result((1,)) # User exists
    mock_request_reset.return_value = None # No error
    
    payload = {"id": 1}
    response = client.post("/forgot-password", json=payload)
    
    assert response.status_code == 200
    assert response.json()["text"] == "Password reset instructions sent"

def test_feedback_endpoint(client, mock_db):
    payload = {
        "user_id": 1,
        "feedback_text": "Great app!"
    }
    response = client.post("/feedback", json=payload)
    
    assert response.status_code == 200
    assert response.json()["text"] == "Feedback submitted successfully"

@patch('server.verifyInstructorOrTa')
def test_instructor_reset_password(mock_verify, client, mock_db):
    mock_verify.return_value = True # Authorized
    mock_db.set_fetchone_result((2,)) # Target user exists
    
    payload = {
        "user_id": 1,
        "target_user_id": 2,
        "new_password": "force_new_password"
    }
    response = client.post("/instructor/reset-password", json=payload)
    
    assert response.status_code == 200
    assert response.json()["text"] == "Password reset successfully"

@patch('server.verifyInstructorOrTa')
def test_instructor_reset_password_unauthorized(mock_verify, client, mock_db):
    mock_verify.return_value = False # Not authorized
    
    payload = {
        "user_id": 1,
        "target_user_id": 2,
        "new_password": "force_new_password"
    }
    response = client.post("/instructor/reset-password", json=payload)
    
    assert response.status_code == 403
    assert "Instructor or TA privileges required" in response.json()["detail"]
