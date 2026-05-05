import pytest
from unittest.mock import patch
from services.roles import (
    enroll_student_in_course_in_db,
    enroll_student_in_bulk,
    unenroll_all_students_in_course_in_db
)

@pytest.mark.asyncio
@patch('services.roles.ensure_bulk_user_exists')
async def test_enroll_student(mock_ensure, mock_db):
    mock_ensure.return_value = True
    # mock role fetchone to return None (meaning not enrolled yet)
    mock_db.set_fetchone_result(None)
    
    result_id = await enroll_student_in_course_in_db(course_id=1, student_id=1, email="test@test.com")
    
    assert mock_db.committed
    assert mock_ensure.called

@pytest.mark.asyncio
@patch('services.roles.ensure_bulk_user_exists')
async def test_enroll_student_in_bulk(mock_ensure, mock_db):
    mock_ensure.return_value = True
    
    await enroll_student_in_bulk(course_id=1, enroll=True, students=[(1, "test1@test.com"), (2, "test2@test.com")])
    
    assert mock_db.committed
    assert mock_ensure.called

def test_unenroll_all_students(mock_db):
    unenroll_all_students_in_course_in_db(course_id=1)
    
    assert mock_db.committed
