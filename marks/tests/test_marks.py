import pytest
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_add_marks_success(client, mock_db, mock_rabbitmq):
    mock_conn, mock_cursor = mock_db
    
    # Mock authentication
    with patch("routes.marks.verifyInstructorOrTa", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = True
        
        # Mock database response for existing marks (empty)
        mock_cursor.fetchall.return_value = []
        
        payload = {
            "recorded_by_id": 123,
            "marks": [{"student_id": 456, "marks_obtained": 85.5}]
        }
        
        response = await client.post("/101/1/marks", json=payload)
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Marks added successfully"
        
        # Verify DB calls
        assert mock_cursor.executemany.called
        assert mock_conn.commit.called
        
        # Verify RabbitMQ calls
        assert mock_rabbitmq.basic_publish.called

@pytest.mark.asyncio
async def test_get_marks_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.marks.verifyInstructorOrTa", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = True
        
        # Mock database results
        mock_cursor.fetchall.return_value = [
            (456, 85.5, 123, "2026-05-05 12:00:00")
        ]
        
        response = await client.get("/101/1/marks", params={"user_id": 123})
        
        assert response.status_code == 200
        assert len(response.json()["marks"]) == 1
        assert response.json()["marks"][0]["student_id"] == 456

@pytest.mark.asyncio
async def test_publish_marks_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.marks.verifyInstructorOrTa", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = True
        
        mock_cursor.rowcount = 1
        
        response = await client.put("/101/1/publish", params={"user_id": 123})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Marks published successfully"
        assert mock_conn.commit.called

@pytest.mark.asyncio
async def test_delete_marks_success(client, mock_db, mock_rabbitmq):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.marks.verifyInstructorOrTa", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = True
        
        # Mock existing mark for deletion
        mock_cursor.fetchall.side_effect = [
            [(456, 85.5, 123, "2026-05-05 12:00:00")], # for get_marks_from_db check
        ]
        mock_cursor.rowcount = 1
        
        response = await client.delete("/101/1/marks/456", params={"user_id": 123})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Marks deleted successfully"
        assert mock_conn.commit.called
        assert mock_rabbitmq.basic_publish.called
