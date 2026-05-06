import pytest
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_create_policy_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_admin, \
         patch("routes.policy.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_admin.return_value = False
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        # Mock get_policy_from_db to return None (first policy)
        mock_cursor.fetchone.return_value = None 
        mock_cursor.lastrowid = 1
        
        payload = {
            "policy_name": "Standard Grading",
            "total_weightage": 100,
            "set_by_id": 123,
            "components": [
                {
                    "assessment_category_id": 1,
                    "weightage": 50,
                    "rules": {"rule_type": "best_of", "rule_params": {"n": 1}}
                }
            ]
        }
        
        response = await client.post("/courses/101/policy", json=payload)
        
        assert response.status_code == 200
        assert response.json()["policy_id"] == 1
        assert mock_conn.commit.called

@pytest.mark.asyncio
async def test_get_all_policy_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_admin, \
         patch("routes.policy.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_admin.return_value = False
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        # Mock course_policy retrieval
        mock_cursor.fetchall.side_effect = [
            [(1, 100.0, "Standard", 123, 123, "2026-05-05", "2026-05-05", 1)], # policies
            [(1, 1, 100.0, "2026-05-05", "2026-05-05")], # components
            [(1, "best_of", '{"n": 1}')] # rules
        ]
        mock_cursor.fetchone.side_effect = [
            (1, "best_of", '{"n": 1}') # rule for component
        ]
        
        response = await client.get("/courses/101/policy", params={"user_id": 123})
        
        assert response.status_code == 200
        assert len(response.json()["policy"]) == 1
        assert response.json()["policy"][0]["policy_name"] == "Standard"

@pytest.mark.asyncio
async def test_update_policy_success(client, mock_db, mock_rabbitmq, mock_httpx_client):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_admin, \
         patch("routes.policy.verifyRoleInCourse", new_callable=AsyncMock) as mock_verify:
        mock_admin.return_value = False
        mock_verify.return_value = {"success": True, "role": "instructor"}
        
        # Mock courses service response for students
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"roles": [{"user_id": 456, "email": "s@s.com"}]}
        mock_httpx_client.get.return_value = mock_response
        
        payload = {
            "id": 1,
            "policy_name": "Updated Policy",
            "total_weightage": 100,
            "updated_by_id": 123
        }
        
        response = await client.put("/courses/101/policy", json=payload)
        
        assert response.status_code == 200
        assert response.json()["detail"] == "Policy updated successfully"
        assert mock_conn.commit.called
        assert mock_rabbitmq.basic_publish.called

@pytest.mark.asyncio
async def test_get_total_scores_success(client, mock_db):
    mock_conn, mock_cursor = mock_db
    
    with patch("routes.policy.verifyAdmin", new_callable=AsyncMock) as mock_admin, \
         patch("routes.policy.verifyInstructorOrTA", new_callable=AsyncMock) as mock_verify:
        mock_admin.return_value = False
        mock_verify.return_value = True
        
        # Mock computed_totals retrieval
        mock_cursor.fetchall.return_value = [
            (1, 456, 85.5, "A", "2026-05-05", "2026-05-05")
        ]
        
        response = await client.get("/courses/101/total", params={"user_id": 123})
        
        assert response.status_code == 200
        assert len(response.json()["totals"]) == 1
        assert response.json()["totals"][0]["final_grade"] == "A"
