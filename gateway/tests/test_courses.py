import pytest
from unittest.mock import patch, MagicMock
from server import app
from utils.auth import verify_token

@pytest.fixture(autouse=True)
def override_auth():
    # Override verify_token for all tests in this file
    app.dependency_overrides[verify_token] = lambda: {"user_id": 123, "role": "admin"}
    yield
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_courses_success(client, mock_httpx_client):
    # Mock courses service response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"id": 1, "name": "CS101"}]
    mock_httpx_client.get.return_value = mock_response

    response = await client.get("/courses/", headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json()[0]["name"] == "CS101"

@pytest.mark.asyncio
async def test_create_course_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"id": 1, "name": "CS101"}
    mock_httpx_client.post.return_value = mock_response

    payload = {
        "course_code": "CS101",
        "name": "Intro to CS",
        "semester": "Fall 2026",
        "credits": 4
    }
    response = await client.post("/courses/", json=payload, headers={"Authorization": "Bearer token"})

    # The gateway returns response.json() which defaults to 200 in FastAPI
    assert response.status_code == 200
    assert response.json()["name"] == "CS101"

@pytest.mark.asyncio
async def test_enroll_student_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"detail": "Enrolled"}
    mock_httpx_client.post.return_value = mock_response

    payload = {"student_id": 456, "email": "s@s.com"}
    response = await client.post("/courses/101/enroll", json=payload, headers={"Authorization": "Bearer token"})

    assert response.status_code == 200
    assert response.json()["detail"] == "Enrolled"
