import pytest
from unittest.mock import patch

@patch('routes.assessments.verifyInstructor')
def test_get_course_analytics_overview_success(mock_verify, client, mock_db):
    mock_verify.return_value = True
    # mock get_course_overview_from_db return via mock_db fetchone
    mock_db.set_fetchone_result((1, 1, 85.5, 85.0, 100.0, 50.0, 10.0, 100, "2023-01-01", 1))
    
    response = client.get("/1/analytics/overview?user_id=1")
    
    assert response.status_code == 200
    assert "overview" in response.json()

@patch('routes.assessments.verifyInstructor')
def test_get_course_analytics_overview_unauthorized(mock_verify, client, mock_db):
    mock_verify.return_value = False
    
    response = client.get("/1/analytics/overview?user_id=1")
    
    assert response.status_code == 403
    assert "Instructor privileges required" in response.json()["detail"]

@patch('routes.assessments.verifyRoleInCourse')
def test_get_assessment_analytics_success(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.set_fetchone_result((1, 1, 1, 85.5, 85.0, 100.0, 50.0, 10.0, 100, "2026-05-05", 1))
    
    response = client.get("/1/assessments/1/analytics?user_id=1")
    
    assert response.status_code == 200
    assert "assessment_analytics" in response.json()

@patch('routes.assessments.verifyRoleInCourse')
def test_get_assessment_analytics_unauthorized(mock_verify, client, mock_db):
    mock_verify.return_value = False
    
    response = client.get("/1/assessments/1/analytics?user_id=1")
    
    assert response.status_code == 403
    assert "Instructor privileges required" in response.json()["detail"]

@patch('routes.assessments.verifyInstructor')
def test_get_assessment_frequencies_success(mock_verify, client, mock_db):
    mock_verify.return_value = True
    mock_db.set_fetchall_result([(1, 1, 1, 85.0, 5, "2023-01-01")])
    
    response = client.get("/1/assessments/1/frequencies?user_id=1")
    
    assert response.status_code == 200
    assert "frequencies" in response.json()

@patch('services.assessments.MySQLdb.connect')
@patch('routes.assessments.verifyAdmin')
def test_get_system_overview_success(mock_verify, mock_connect, client, mock_db):
    mock_verify.return_value = True
    mock_connect.return_value = mock_db
    mock_db.set_fetchone_result([
        (10, 5, 5), # courses overview
        (100,),      # students count
        (10,),       # instructors count
        (50,),       # total assessments
        (85.5,)      # avg grade
    ])
    
    response = client.get("/system/overview?user_id=1")
    
    assert response.status_code == 200
    assert "overview" in response.json()

@patch('routes.assessments.verifyAdmin')
def test_get_system_overview_unauthorized(mock_verify, client, mock_db):
    mock_verify.return_value = False
    
    response = client.get("/system/overview?user_id=1")
    
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]
