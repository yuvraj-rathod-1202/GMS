import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_get_all_policy_admin_bypass(client):
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.policy.get_policy_from_db") as mock_get:
        
        mock_verify_admin.return_value = True
        mock_get.return_value = [{"id": 1, "policy_name": "Admin View Policy"}]
        
        response = await client.get("/courses/1/policy", params={"user_id": 999})
        
        assert response.status_code == 200
        assert response.json()["policy"] == [{"id": 1, "policy_name": "Admin View Policy"}]
        mock_verify_admin.assert_called_with(999)

@pytest.mark.asyncio
async def test_create_policy_admin_bypass(client):
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.policy.add_policy_to_db") as mock_add, \
         patch("routes.policy.get_policy_from_db") as mock_get_existing, \
         patch("routes.policy.set_policy_as_default_in_db") as mock_set_default:
        
        mock_verify_admin.return_value = True
        mock_add.return_value = 50
        mock_get_existing.return_value = None # First policy
        
        policy_data = {
            "policy_name": "Global Policy",
            "total_weightage": 100,
            "set_by_id": 999,
            "components": []
        }
        
        response = await client.post("/courses/1/policy", json=policy_data)
        
        assert response.status_code == 200
        assert response.json()["policy_id"] == 50
        mock_verify_admin.assert_called_with(999)

@pytest.mark.asyncio
async def test_delete_policy_admin_bypass(client):
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.policy.delete_policy_from_db") as mock_delete:
        
        mock_verify_admin.return_value = True
        mock_delete.return_value = True
        
        response = await client.delete("/courses/1/policy/50", params={"user_id": 999})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Policy deleted successfully"
        mock_verify_admin.assert_called_with(999)

@pytest.mark.asyncio
async def test_recalculate_total_admin_bypass(client):
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_verify_admin, \
         patch("routes.policy.initialize_total_recalculation", new_callable=AsyncMock) as mock_recalc:
        
        mock_verify_admin.return_value = True
        
        response = await client.post("/courses/1/policy/recalculate", params={"user_id": 999})
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Policy recalculation initiated"
        mock_recalc.assert_called()
