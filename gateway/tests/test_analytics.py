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
async def test_get_course_analytics_overview(client, mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"overview": "data"}
    mock_httpx_client.get.return_value = mock_response

    response = await client.get("/courses/101/analytics/overview")

    assert response.status_code == 200
    assert response.json()["overview"] == "data"
    mock_httpx_client.get.assert_called_once()
