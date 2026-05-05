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
def mock_db():
    with patch("services.marks.get_db") as mock_get_db, \
         patch("services.assessments.get_db") as mock_get_db_ass:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        mock_get_db_ass.return_value = mock_conn
        yield mock_conn, mock_cursor

@pytest.fixture
def mock_rabbitmq():
    with patch("services.marks.get_rabbitmq_connection") as mock_conn:
        mock_connection = MagicMock()
        mock_channel = MagicMock()
        mock_connection.channel.return_value = mock_channel
        mock_conn.return_value = mock_connection
        yield mock_channel

@pytest.fixture
def mock_httpx_client():
    with patch("httpx.AsyncClient") as mock:
        mock_instance = MagicMock()
        mock.return_value.__aenter__.return_value = mock_instance
        mock_instance.get = AsyncMock()
        mock_instance.post = AsyncMock()
        yield mock_instance
