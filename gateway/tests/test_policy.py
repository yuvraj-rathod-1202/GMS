import pytest
from unittest.mock import MagicMock
from server import app
from utils.auth import verify_token

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[verify_token] = lambda: {"user_id": 123}
    yield
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_policy_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"id": 1, "name": "Policy 1"}]
    mock_httpx_client.get.return_value = mock_response

    response = await client.get("/courses/101/policy")

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Policy 1"

@pytest.mark.asyncio
async def test_create_policy_success(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"id": 1}
    mock_httpx_client.post.return_value = mock_response

    payload = {
        "policy_name": "New Policy",
        "total_weightage": 100,
        "components": []
    }
    response = await client.post("/courses/101/policy", json=payload)

    assert response.status_code == 200
    assert response.json()["id"] == 1
