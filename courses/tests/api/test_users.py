import pytest
from unittest.mock import patch

def test_get_user_courses(client, mock_db):
    mock_db.set_fetchall_result([(1, "CS101", "Intro to CS", "Fall 2026", 4, "ongoing", 100, "2026-05-05", "student")])
    
    response = client.get("/me/courses?user_id=1")
    assert response.status_code == 200

def test_get_user_course_roles(client, mock_db):
    mock_db.set_fetchone_result(("instructor",))
    
    response = client.get("/user/1/roles?user_id=1")
    assert response.status_code == 200
