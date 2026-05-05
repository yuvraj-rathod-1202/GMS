import pytest
from unittest.mock import patch, MagicMock
from utils.auth import verify_token
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_verify_token_success(mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"user_id": 123, "role": "admin"}
    mock_httpx_client.post.return_value = mock_response

    result = await verify_token("Bearer valid-token")
    
    assert result["user_id"] == 123
    assert result["role"] == "admin"

@pytest.mark.asyncio
async def test_verify_token_no_header():
    with pytest.raises(HTTPException) as excinfo:
        await verify_token(None)
    assert excinfo.value.status_code == 401
    assert "Missing authorization header" in excinfo.value.detail

@pytest.mark.asyncio
async def test_verify_token_invalid(mock_httpx_client):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_httpx_client.post.return_value = mock_response

    with pytest.raises(HTTPException) as excinfo:
        await verify_token("Bearer invalid-token")
    assert excinfo.value.status_code == 401
    assert "Invalid or expired token" in excinfo.value.detail
