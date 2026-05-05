import pytest
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_create_assessment_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.assessments.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        # Mock lastrowid for new assessment
        mock_cursor.lastrowid = 1
        
        payload = {
            "user_id": 123,
            "name": "Midterm",
            "assessment_type_id": 1,
            "max_marks": 100.0,
            "is_marks_published": False,
            "assessment_date": "2026-05-05T12:00:00"
        }
        
        response = await client.post("/101/assessments", json=payload)
        
        assert response.status_code == 200
        assert response.json()["assessment_id"] == 1
        assert mock_conn.commit.called

@pytest.mark.asyncio
async def test_get_all_assessments_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.assessments.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {"role": "instructor", "success": True}
        
        # Mock database results (10 columns as expected by get_all_assessments_from_db)
        mock_cursor.fetchall.return_value = [
            (1, 101, "Midterm", 1, 100.0, 0, "2026-05-05 12:00:00", 123, "2026-05-05 10:00:00", "2026-05-05 11:00:00")
        ]
        
        response = await client.get("/101/assessments", params={"user_id": 123})
        
        assert response.status_code == 200
        assert len(response.json()["assessments"]) == 1
        assert response.json()["assessments"][0]["name"] == "Midterm"

@pytest.mark.asyncio
async def test_update_assessment_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.assessments.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        mock_cursor.rowcount = 1
        
        payload = {
            "user_id": 123,
            "name": "Updated Midterm"
        }
        
        response = await client.put("/assessments/101/1", json=payload)
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Assessment updated successfully"
        assert mock_conn.commit.called

@pytest.mark.asyncio
async def test_delete_assessment_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.assessments.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        mock_cursor.rowcount = 1
        
        response = await client.delete("/assessments/101/1", params={"user_id": 123})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Assessment deleted successfully"
        assert mock_conn.commit.called
