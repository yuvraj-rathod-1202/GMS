import pytest
from services.courses import (
    fetch_all_courses_from_db,
    add_course_to_db,
    fetch_course_by_id_from_db,
    update_course_status_in_db,
    delete_course_from_db,
    fetch_course_roles_from_db
)
from models.schemas.courses import UpdateCourseStatusRequest

def test_fetch_all_courses(mock_db):
    mock_db.set_fetchall_result([(1, "CS101", "Intro to CS", "Fall 2026", 4, "ongoing", 100, "2026-05-05", "2026-05-05")])
    result = fetch_all_courses_from_db()
    assert len(result) == 1
    assert result[0].course_code == "CS101"

def test_add_course(mock_db):
    mock_db.set_fetchone_result((1,)) # LAST_INSERT_ID()
    result = add_course_to_db("CS102", "Data Structures", "Spring 2027", 4)
    assert result == 1
    assert mock_db.committed

def test_fetch_course_by_id(mock_db):
    mock_db.set_fetchone_result((1, "CS101", "Intro to CS", "Fall 2026", 4, "ongoing", 100, "2026-05-05", "2026-05-05"))
    result = fetch_course_by_id_from_db(1)
    assert result is not None
    assert result.course_code == "CS101"

def test_update_course_status(mock_db):
    update_data = UpdateCourseStatusRequest(status="completed", user_id=1)
    mock_db.mock_cursor.rowcount = 1
    result = update_course_status_in_db(1, update_data)
    assert result is True
    assert mock_db.committed

def test_delete_course(mock_db):
    mock_db.mock_cursor.rowcount = 1
    result = delete_course_from_db(1)
    assert result is True
    assert mock_db.committed

def test_fetch_course_roles(mock_db):
    mock_db.set_fetchall_result([(1, "test@test.com")])
    result = fetch_course_roles_from_db(1, "instructor")
    assert len(result) == 1
    assert result[0]["email"] == "test@test.com"
