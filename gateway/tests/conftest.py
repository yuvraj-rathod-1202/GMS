import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from server import app
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_httpx_client():
    with patch("httpx.AsyncClient") as mock:
        mock_instance = MagicMock()
        # Mock async context manager
        mock.return_value.__aenter__.return_value = mock_instance
        
        # Mock async methods
        mock_instance.get = AsyncMock()
        mock_instance.post = AsyncMock()
        mock_instance.put = AsyncMock()
        mock_instance.delete = AsyncMock()
        
        yield mock_instance
