import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_get_all_assessments_admin_success(client):
    with patch("routes.assessments.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.assessments.fetch_system_wide_assessments") as mock_fetch:
        
        mock_verify_admin.return_value = True
        mock_fetch.return_value = [{"id": 1, "name": "Global Assessment"}]
        
        response = await client.get("/assessments/all", params={"user_id": 999})
        
        assert response.status_code == 200
        assert response.json() == [{"id": 1, "name": "Global Assessment"}]
        mock_verify_admin.assert_called_with(999)

@pytest.mark.asyncio
async def test_get_all_assessments_admin_forbidden(client):
    with patch("routes.assessments.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin:
        mock_verify_admin.return_value = False
        
        response = await client.get("/assessments/all", params={"user_id": 123})
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin privileges required"

@pytest.mark.asyncio
async def test_create_assessment_admin_bypass(client):
    with patch("routes.assessments.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.assessments.add_assessment_to_db") as mock_add:
        
        mock_verify_admin.return_value = True
        mock_add.return_value = 101
        
        assessment_data = {
            "name": "Admin Quiz",
            "max_marks": 50,
            "assessment_type_id": 1,
            "assessment_date": "2026-05-05",
            "is_marks_published": False,
            "user_id": 999
        }
        
        response = await client.post("/1/assessments", json=assessment_data)
        
        assert response.status_code == 200
        assert response.json()["assessment_id"] == 101
        # Should not call verifyRoleInCourse because of admin bypass
        mock_verify_admin.assert_called_with(999)

@pytest.mark.asyncio
async def test_delete_assessment_admin_bypass(client):
    with patch("routes.assessments.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.assessments.delete_assessment_from_db") as mock_delete:
        
        mock_verify_admin.return_value = True
        mock_delete.return_value = True
        
        response = await client.delete("/assessments/1/101", params={"user_id": 999})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Assessment deleted successfully"
        mock_verify_admin.assert_called_with(999)
