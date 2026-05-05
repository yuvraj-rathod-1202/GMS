import pytest
from unittest.mock import patch, MagicMock
from server import app
from utils.auth import verify_token

@pytest.fixture
def override_auth():
    app.dependency_overrides[verify_token] = lambda: {"user_id": 123}
    yield
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_login_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"token": "fake-token", "user": {"id": 123}}
    mock_httpx_client.post.return_value = mock_response

    response = await client.post(
        "/auth/login",
        auth=("123", "password")
    )

    assert response.status_code == 200
    assert response.json()["token"] == "fake-token"

@pytest.mark.asyncio
async def test_login_failure(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.json.return_value = {"detail": "Invalid credentials"}
    mock_httpx_client.post.return_value = mock_response

    response = await client.post(
        "/auth/login",
        auth=("123", "wrong")
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

@pytest.mark.asyncio
async def test_signup_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"id": 123, "email": "test@test.com"}
    mock_httpx_client.post.return_value = mock_response

    payload = {
        "id": 123,
        "email": "test@test.com",
        "password": "password"
    }
    response = await client.post("/auth/signup", json=payload)

    # Gateway returns response.json() -> status 200
    assert response.status_code == 200
    assert response.json()["id"] == 123

@pytest.mark.asyncio
async def test_logout_success(client, mock_httpx_client, override_auth):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_httpx_client.post.return_value = mock_response

    response = await client.post(
        "/auth/logout",
        auth=("123", "password"),
        headers={"Authorization": "Bearer token"}
    )

    assert response.status_code == 200
    assert response.json()["text"] == "Logged out successfully"
