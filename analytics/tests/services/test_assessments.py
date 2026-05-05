import pytest
from services.assessments import (
    get_course_overview_from_db,
    get_assessment_analytics_from_db,
    get_assessment_frequencies_from_db,
    get_system_overview_from_db
)

def test_get_course_overview(mock_db):
    # Mocking fetchall to return some dummy data
    mock_db.set_fetchone_result((1, 1, 85.5, 85.0, 100.0, 50.0, 10.0, 100, "2026-05-05", 1))
    
    result = get_course_overview_from_db(1)
    
    assert result is not None
    queries = mock_db.get_queries()
    assert len(queries) > 0
    assert "course_id" in queries[0][0] or "%s" in queries[0][0]

def test_get_assessment_analytics(mock_db):
    # 11 elements for assessment analytics
    mock_db.set_fetchone_result((1, 1, 1, 85.5, 85.0, 100.0, 50.0, 10.0, 100, "2026-05-05", 1))
    
    result = get_assessment_analytics_from_db(1, 1)
    
    assert result is not None
    queries = mock_db.get_queries()
    assert len(queries) > 0

def test_get_assessment_frequencies(mock_db):
    # 6 elements for frequencies (id, course_id, assessment_id, mark, frequency, computed_at)
    mock_db.set_fetchall_result([(1, 1, 1, 85.0, 5, "2026-05-05")])
    
    result = get_assessment_frequencies_from_db(1, 1)
    
    assert result is not None
    queries = mock_db.get_queries()
    assert len(queries) > 0

from unittest.mock import patch

@patch('services.assessments.MySQLdb.connect')
def test_get_system_overview(mock_connect, mock_db):
    mock_connect.return_value = mock_db
    mock_db.set_fetchone_result([
        (10, 5, 5), # courses overview
        (100,),      # students count
        (10,),       # instructors count
        (50,),       # total assessments
        (85.5,)      # avg grade
    ])
    
    result = get_system_overview_from_db()
    
    assert result is not None
    queries = mock_db.get_queries()
    assert len(queries) > 0
