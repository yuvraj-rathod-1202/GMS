import pytest
from unittest.mock import patch

@patch('routes.courses.verifyAdmin')
def test_get_all_courses(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.set_fetchall_result([(1, "CS101", "Intro to CS", "Fall 2026", 4, "ongoing", 100, "2026-05-05", "2026-05-05")])
    
    response = client.get("/all?user_id=1")
    assert response.status_code == 200

@patch('routes.courses.verifyAdmin')
def test_add_course(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.set_fetchone_result((1,))
    
    response = client.post("/", json={
        "course_code": "CS102",
        "name": "Data Structures",
        "semester": "Spring 2027",
        "credits": 4,
        "user_id": 1
    })
    assert response.status_code == 200

@patch('routes.courses.verifyAdmin')
def test_update_course_status(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.mock_cursor.rowcount = 1
    
    response = client.put("/id/1", json={"status": "inactive", "user_id": 1})
    assert response.status_code == 200

@patch('routes.courses.verifyAdmin')
def test_delete_course(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.mock_cursor.rowcount = 1
    
    response = client.delete("/id/1?user_id=1")
    assert response.status_code == 200

@patch('routes.courses.verifyInstructorOrTa')
def test_get_course_roles(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.set_fetchall_result([(1, 1, 2, "instructor", "2026-05-05")])
    
    response = client.get("/id/1/roles/instructor?user_id=1")
    assert response.status_code == 200
