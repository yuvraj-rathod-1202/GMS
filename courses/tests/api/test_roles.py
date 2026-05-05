import pytest
from unittest.mock import patch

@patch('routes.roles.verifyInstructorOrTa')
@patch('routes.roles.enroll_student_in_course_in_db')
def test_enroll_student(mock_enroll, mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_enroll.return_value = 1
    
    response = client.post("/1/enroll?user_id=1", json={
        "course_id": 1,
        "student_id": 2,
        "email": "test@test.com",
        "enroll": True,
        "user_id": 1
    })
    assert response.status_code == 200

@patch('routes.roles.verifyInstructorOrTa')
@patch('routes.roles.enroll_student_in_bulk')
def test_enroll_student_bulk(mock_enroll, mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_enroll.return_value = True
    
    response = client.post("/1/enroll/bulk?user_id=1", json={
        "course_id": 1,
        "enroll": True,
        "user_id": 1,
        "students": [
            {"student_id": 2, "email": "test2@test.com"}
        ]
    })
    assert response.status_code == 200

@patch('routes.roles.verifyInstructorOrTa')
@patch('routes.roles.unenroll_all_students_in_course_in_db')
def test_unenroll_all_students(mock_unenroll, mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_unenroll.return_value = True
    
    response = client.post("/1/unenroll/all?user_id=1", json={
        "user_id": 1,
        "course_id": 1
    })
    assert response.status_code == 200
