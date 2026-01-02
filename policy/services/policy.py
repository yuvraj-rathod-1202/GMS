from fastapi import HTTPException, status
from models.schema.policy import CreatePolicyRequest
from utils.db import get_db
from models.dbobj.policy import PolicyDBObj, GradingComponentDBObj, GradingRuleDBObj

def add_policy_to_db(course_id: int, data: CreatePolicyRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "INSERT INTO course_policy (course_id, total_weightage, set_by_id) VALUES (%s, %s, %s)",
            (course_id, data.total_weightage, data.set_by_id)
        )
        
        policy_id = cursor.lastrowid
        
        for component in data.components:
            cursor.execute(
                "INSERT INTO grading_components (course_policy_id, assessment_category_id, weightage) VALUES (%s, %s, %s)",
                (policy_id, component.assessment_category_id, component.weightage)
            )
            
            component_id = cursor.lastrowid
            
            for rule in component.rules:
                cursor.execute(
                    "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params, priority) INTO (%s, %s, %s, %s)",
                    (component_id, rule.rule_type, rule.rule_params, rule.priority)
                )
                
        db.commit()
        return policy_id
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
            
def get_policy_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id, total_weightage, set_by_id, created_at, updated_at FROM course_policy WHERE course_id = %s",
            (course_id,)
        )
        
        policy = cursor.fetchone()
        policy = PolicyDBObj(id=policy[0], course_id=course_id, total_weightage=policy[1], set_by_id=policy[2], set_at=policy[3], updated_at=policy[4], components=[]) if policy else None
        
        if not policy:
            return None
        
        cursor.execute(
            "SELECT id, assessment_category_id, weightage, created_at, updated_at FROM grading_components WHERE course_policy_id = %s",
            (policy.id,)
        )
        
        components = cursor.fetchall()
        components = [GradingComponentDBObj(id=component[0], assessment_category_id=component[1], weightage=component[2], created_at=component[3], updated_at=component[4], rules=[]) for component in components]
        
        for component in components:
            cursor.execute(
                "SELECT id, rule_type, rule_params, priority FROM grading_rule WHERE grading_component_id = %s",
                (component.id,)
            )
            rules = cursor.fetchall()
            component.rules = [GradingRuleDBObj(id=rule[0], rule_type=rule[1], rule_params=rule[2], priority=rule[3]) for rule in rules]
            
        policy.components = components
        return policy
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )   