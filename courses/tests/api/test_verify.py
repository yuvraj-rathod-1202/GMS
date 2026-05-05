import pytest
from unittest.mock import patch

def test_verify_admin(client, mock_db):
    mock_db.set_fetchone_result((1,))
    
    response = client.get("/verifyadmin?user_id=1")
    assert response.status_code == 200
    assert response.json() == {"success": True}

def test_verify_instructor(client, mock_db):
    mock_db.set_fetchone_result((1,))
    
    response = client.get("/verifyinstructor?user_id=1&course_id=1")
    assert response.status_code == 200

def test_verify_instructor_or_ta(client, mock_db):
    mock_db.set_fetchone_result((1,))
    
    response = client.get("/verifyinstructororta?user_id=1&course_id=1")
    assert response.status_code == 200

def test_verify_role_in_course(client, mock_db):
    mock_db.set_fetchone_result(("student",))
    
    response = client.get("/verifyroleincourse?user_id=1&course_id=1")
    assert response.status_code == 200
    assert response.json()["role"] == "student"
