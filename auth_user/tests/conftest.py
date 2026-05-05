import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
import os

# Ensure the parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server import app

class MockCursor:
    def __init__(self):
        self.fetchone_result = None
        self.fetchall_result = []
        self.queries = []
        self.executed_many = []

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def executemany(self, query, params_list):
        self.executed_many.append((query, params_list))

    def fetchone(self):
        return self.fetchone_result

    def fetchall(self):
        return self.fetchall_result

class MockDB:
    def __init__(self):
        self.mock_cursor = MockCursor()
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return self.mock_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True
        
    def set_fetchone_result(self, result):
        self.mock_cursor.fetchone_result = result
        
    def set_fetchall_result(self, result):
        self.mock_cursor.fetchall_result = result
        
    def get_queries(self):
        return self.mock_cursor.queries

@pytest.fixture
def mock_db():
    """Fixture that provides a MockDB instance and patches the real get_db."""
    db_instance = MockDB()
    
    # Patch get_db in services.auth
    with patch('services.auth.get_db', return_value=db_instance) as mock_get_db_services:
        yield db_instance

@pytest.fixture
def client(mock_db): # Inject mock_db to ensure patch is active during client requests
    """Fixture to provide the FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client
