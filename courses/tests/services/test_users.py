import pytest
from services.users import (
    fetch_course_roles_from_db,
    fetch_all_course_from_db
)

def test_fetch_course_roles(mock_db):
    mock_db.set_fetchone_result(("instructor",))
    
    result = fetch_course_roles_from_db(course_id=1, user_id=1)
    
    assert result == "instructor"

def test_fetch_all_course(mock_db):
    mock_db.set_fetchall_result([(1, "CS101", "Intro to CS", "Fall 2026", 4, "ongoing", 100, "2026-05-05", "student")])
    
    result = fetch_all_course_from_db(user_id=1)
    
    assert len(result) == 1
    assert result[0].course_code == "CS101"
    assert result[0].role == "student"
