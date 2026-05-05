import pytest
from unittest.mock import patch
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
        self.rowcount = 1
        self.lastrowid = 1

    def execute(self, query, params=None):
        self.queries.append((query, params))

    def executemany(self, query, params_list):
        self.executed_many.append((query, params_list))

    def fetchone(self):
        if isinstance(self.fetchone_result, list):
            return self.fetchone_result.pop(0) if self.fetchone_result else None
        return self.fetchone_result

    def fetchall(self):
        if isinstance(self.fetchall_result, list) and self.fetchall_result and isinstance(self.fetchall_result[0], list):
             return self.fetchall_result.pop(0) if self.fetchall_result else []
        return self.fetchall_result
        
    def close(self):
        pass

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
        
    def close(self):
        pass

@pytest.fixture
def mock_db():
    """Fixture that provides a MockDB instance and patches the real get_db."""
    db_instance = MockDB()
    
    with patch('services.courses.get_db', return_value=db_instance), \
         patch('services.roles.get_db', return_value=db_instance), \
         patch('services.users.get_db', return_value=db_instance), \
         patch('utils.auth.get_db', return_value=db_instance):
        yield db_instance

@pytest.fixture
def client(mock_db): 
    """Fixture to provide the FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client
