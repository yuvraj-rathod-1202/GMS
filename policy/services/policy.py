import json
import os, pika
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException, status
from models.schema.policy import AssignPolicyRequest, CreatePolicyRequest, UpdatePolicyRequest, UpdatePolicyComponentRequest, CreatePolicyComponentRequest
from utils.db import get_db
from models.dbobj.policy import PolicyDBObj, GradingComponentDBObj, GradingRuleDBObj, TotalScoreDBObj
import httpx

# Thread pool for blocking RabbitMQ operations
executor = ThreadPoolExecutor(max_workers=5)

def get_rabbitmq_connection():
    """Create a new RabbitMQ connection"""
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host='rabbitmq',
                heartbeat=600,
                blocked_connection_timeout=300
            )
        )
        return connection
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RabbitMQ connection error: {str(e)}"
        )

def publish_message(routing_key: str, body: dict):
    """Publish message to RabbitMQ (blocking operation)"""
    connection = None
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        channel.queue_declare(queue=routing_key, durable=True)
        
        channel.basic_publish(
            exchange='',
            routing_key=routing_key,
            body=json.dumps(body),
            properties=pika.BasicProperties(
                delivery_mode=pika.DeliveryMode.Persistent
            )
        )
    finally:
        if connection and not connection.is_closed:
            connection.close()

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
            "INSERT INTO course_policy (course_id, total_weightage, policy_name, set_by_id, updated_by_id) VALUES (%s, %s, %s, %s, %s)",
            (course_id, data.total_weightage, data.policy_name, data.set_by_id, data.set_by_id)
        )
        
        policy_id = cursor.lastrowid
        
        for component in data.components:
            cursor.execute(
                "INSERT INTO grading_components (course_policy_id, assessment_category_id, weightage) VALUES (%s, %s, %s)",
                (policy_id, component.assessment_category_id, component.weightage)
            )
            
            component_id = cursor.lastrowid
            
            rule = component.rules
            if rule:
                cursor.execute(
                    "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params) VALUES (%s, %s, %s)",
                    (component_id, rule.rule_type, json.dumps(rule.rule_params))
                )
            
        db.commit()
        return policy_id
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
            
def get_policy_from_db(course_id: int, policy_id: int | None = None):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id, total_weightage, policy_name, set_by_id, updated_by_id, set_at, updated_at, is_default FROM course_policy WHERE course_id = %s AND id = COALESCE(%s, id)",
            (course_id, policy_id)
        )
        
        policies = cursor.fetchall()
        policies = [PolicyDBObj(id=policy[0], course_id=course_id, total_weightage=policy[1], policy_name=policy[2], set_by_id=policy[3], updated_by_id=policy[4], set_at=policy[5], updated_at=policy[6], is_default=policy[7], components=[]) for policy in policies if policies]
        
        if not policies:
            return None
        
        for policy in policies:
            cursor.execute(
                "SELECT id, assessment_category_id, weightage, created_at, updated_at FROM grading_components WHERE course_policy_id = %s",
                (policy.id,)
            )
            
            components = cursor.fetchall()
            components = [GradingComponentDBObj(id=component[0], assessment_category_id=component[1], weightage=component[2], created_at=component[3], updated_at=component[4], rules=None) for component in components]
            
            for component in components:
                cursor.execute(
                    "SELECT id, rule_type, rule_params FROM grading_rule WHERE grading_component_id = %s",
                    (component.id,)
                )
                rule = cursor.fetchone()
                component.rules = GradingRuleDBObj(id=rule[0], rule_type=rule[1], rule_params=json.loads(rule[2])) if rule else None
                
            policy.components = components
        return policies
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def delete_policy_from_db(course_id: int, policy_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id FROM course_policy WHERE course_id = %s AND id = %s",
            (course_id, policy_id)
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
            "UPDATE course_policy SET total_weightage = %s, updated_by_id = %s, policy_name = %s, updated_at = NOW() WHERE id = %s",
            (data.total_weightage, data.updated_by_id, data.policy_name, data.id)
        )
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def set_policy_as_default_in_db(course_id: int, policy_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "UPDATE course_policy SET is_default = FALSE WHERE course_id = %s",
            (course_id,)
        )
        
        cursor.execute(
            "UPDATE course_policy SET is_default = TRUE WHERE id = %s AND course_id = %s",
            (policy_id, course_id)
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def delete_policy_component_from_db(course_id: int, policy_id: int, component_id: int):
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

def add_policy_component_to_db(course_id: int, policy_id: int, data: CreatePolicyComponentRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id FROM course_policy WHERE course_id = %s AND id = %s",
            (course_id, policy_id)
        )
        
        policy = cursor.fetchone()
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course policy not found"
            )
        
        policy_id = policy[0]
        
        cursor.execute(
            "INSERT INTO grading_components (course_policy_id, assessment_category_id, weightage) VALUES (%s, %s, %s)",
            (policy_id, data.assessment_category_id, data.weightage)
        )
        
        component_id = cursor.lastrowid
        
        rule = data.rules
        if rule:
            cursor.execute(
                "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params) VALUES (%s, %s, %s)",
                (component_id, rule.rule_type, json.dumps(rule.rule_params))
            )
            
        db.commit()
        return component_id
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def update_component_in_db(data: UpdatePolicyComponentRequest, policy_id: int, component_id: int):
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
        
        rule = data.rules
        if rule and rule.id:
            cursor.execute(
                "UPDATE grading_rule SET rule_type = %s, rule_params = %s WHERE id = %s",
                (rule.rule_type, json.dumps(rule.rule_params), rule.id)
            )
        elif rule and not rule.id:
            cursor.execute(
                "INSERT INTO grading_rule (grading_component_id, rule_type, rule_params) VALUES (%s, %s, %s)",
                (component_id, rule.rule_type, json.dumps(rule.rule_params))
            )
                
                
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def assign_policy_to_student_in_db(course_id: int, data: AssignPolicyRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        for mapping in data.mapping:
            cursor.execute(
                "INSERT INTO student_course_policy (student_id, course_id, course_policy_id, assigned_by_id, assigned_at) VALUES (%s, %s, %s, %s, NOW()) ON DUPLICATE KEY UPDATE course_policy_id = %s, assigned_by_id = %s, assigned_at = NOW()",
                (mapping.student_id, course_id, mapping.course_policy_id, data.assigned_by_id, mapping.course_policy_id, data.assigned_by_id)
            )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
     
def get_student_policy_mapping_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT student_id, course_policy_id FROM student_course_policy WHERE course_id = %s",
            (course_id,)
        )
        
        rows = cursor.fetchall()
        mapping = {row[0]: row[1] for row in rows}
        
        return mapping
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
async def initialize_total_recalculation(course_id: int, user_id: int):      
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('COURSES_SERVICE_URL')}/id/{course_id}/roles/student",
                params = {"user_id": user_id}
            )
            response.raise_for_status()
            students = response.json().get("roles", [])
            
            body = {
                "course_id": course_id,
                "changes": [{"student_id": student.get("user_id"), "email": student.get("email")} for student in students],
                "initiated_by": user_id
            }
            
            # Run blocking RabbitMQ operation in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                executor,
                publish_message,
                'compute_total',
                body
            )
            
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Compute service error: {str(e)}"
            )
        
def fetch_total_scores_from_db(course_id: int, student_id: int | None = None):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT id, student_id, total_marks, final_grade, computed_at, updated_at FROM computed_totals WHERE course_id = %s AND student_id = COALESCE(%s, student_id)",
            (course_id, student_id)
        )
        
        rows = cursor.fetchall()
        result = [
            TotalScoreDBObj(
                id=row[0],
                student_id=row[1],
                total_marks=row[2],
                final_grade=row[3],
                computed_at=row[4],
                updated_at=row[5]
            )
            for row in rows
        ]
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
