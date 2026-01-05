from fastapi import HTTPException, status
from models.schema.policy import CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentRequest
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
            "INSERT INTO course_policy (course_id, total_weightage, set_by_id, updated_by_id) VALUES (%s, %s, %s, %s)",
            (course_id, data.total_weightage, data.set_by_id, data.set_by_id)
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
                    "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params, priority) VALUES (%s, %s, %s, %s)",
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
            "SELECT id, total_weightage, set_by_id, updated_by_id, set_at, updated_at FROM course_policy WHERE course_id = %s",
            (course_id,)
        )
        
        policy = cursor.fetchone()
        policy = PolicyDBObj(id=policy[0], course_id=course_id, total_weightage=policy[1], set_by_id=policy[2], updated_by_id=policy[3], set_at=policy[4], updated_at=policy[5], components=[]) if policy else None
        
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
        
def delete_policy_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id FROM course_policy WHERE course_id = %s",
            (course_id,)
        )
        
        policy = cursor.fetchone()
        if not policy:
            return False
        
        policy_id = policy[0]
        
        cursor.execute(
            "SELECT id FROM grading_components WHERE course_policy_id = %s",
            (policy_id,)
        )
        
        components = cursor.fetchall()
        component_ids = [component[0] for component in components]
        
        if component_ids:
            format_strings = ','.join(['%s'] * len(component_ids))
            cursor.execute(
                f"DELETE FROM grading_rule WHERE grading_component_id IN ({format_strings})",
                tuple(component_ids)
            )
            
            cursor.execute(
                f"DELETE FROM grading_components WHERE id IN ({format_strings})",
                tuple(component_ids)
            )
        
        cursor.execute(
            "DELETE FROM course_policy WHERE id = %s",
            (policy_id,)
        )
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def update_policy_in_db(data: UpdatePolicyRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "UPDATE course_policy SET total_weightage = %s, updated_by_id = %s, updated_at = NOW() WHERE id = %s",
            (data.total_weightage, data.updated_by_id, data.id)
        )
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def delete_policy_component_from_db(course_id: int, component_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT cp.id FROM course_policy cp JOIN grading_components gc ON cp.id = gc.course_policy_id WHERE cp.course_id = %s AND gc.id = %s",
            (course_id, component_id)
        )
        
        policy = cursor.fetchone()
        if not policy:
            return False
        
        cursor.execute(
            "DELETE FROM grading_rule WHERE grading_component_id = %s",
            (component_id,)
        )
        
        cursor.execute(
            "DELETE FROM grading_components WHERE id = %s",
            (component_id,)
        )
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def update_component_in_db(data: UpdatePolicyComponentRequest, component_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "UPDATE grading_components SET weightage = %s, assessment_category_id = %s, updated_at = NOW() WHERE id = %s",
            (data.weightage, data.assessment_category_id, component_id)
        )
        
        for rule in data.rules:
            if rule.id:
                cursor.execute(
                    "UPDATE grading_rule SET rule_type = %s, rule_params = %s, priority = %s WHERE id = %s",
                    (rule.rule_type, rule.rule_params, rule.priority, rule.id)
                )
            else:
                cursor.execute(
                    "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params, priority) VALUES (%s, %s, %s, %s)",
                    (component_id, rule.rule_type, rule.rule_params, rule.priority)
                )
                
                
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )