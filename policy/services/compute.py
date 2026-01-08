from utils.db import get_db
from models.schema.compute import ComputeQueueMessage, AllMarksDBObj
from models.dbobj.policy import PolicyDBObj
from services.policy import get_policy_from_db
import httpx, os, pika, asyncio, json
from concurrent.futures import ThreadPoolExecutor
from fastapi import status, HTTPException
from dotenv import load_dotenv

load_dotenv()

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
    except Exception as e:
        print(f"Failed to publish message to RabbitMQ: {e}")
    finally:
        if connection and not connection.is_closed:
            connection.close()

async def publish_message_async(routing_key: str, body: dict):
    """Async wrapper for publishing messages to RabbitMQ"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, publish_message, routing_key, body)

async def get_all_marks_for_student_in_course(student_id: int, course_id: int) -> list[AllMarksDBObj]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{os.getenv('MARKS_SERVICE_URL')}/{course_id}/marks/all/{student_id}",
            params={"user_id": student_id}
        )
        response.raise_for_status()
        data = response.json()
        return [AllMarksDBObj(**mark) for mark in data["marks"]]

def execute_policy_calculation(student_marks: list[AllMarksDBObj], policy: PolicyDBObj) -> float:
    total_score = 0.0
    
    for component in policy.components:
        component_score = 0.0
        component_total_weightage = component.weightage
        component_rule_type = component.rules.rule_type if component.rules else None
        component_rule_params = component.rules.rule_params if component.rules else {}
        
        marks_in_category = [mark for mark in student_marks if mark.assessment_type_id == component.assessment_category_id]
        
        if component_rule_type == "ALL":
            for mark in marks_in_category:
                component_score += mark.marks_obtained*100/mark.max_marks
            total_score += (component_score * component_total_weightage) / (100*len(marks_in_category)) if marks_in_category else 0
                
        elif component_rule_type == "BEST_N":
            n = component_rule_params.get("n", 0)
            sorted_marks = sorted(marks_in_category, key=lambda x: (x.marks_obtained*100)/x.max_marks, reverse=True)
            best_n_marks = sorted_marks[:n]
            for mark in best_n_marks:
                component_score += mark.marks_obtained*100/mark.max_marks
            total_score += (component_score * component_total_weightage) / (100*len(best_n_marks)) if best_n_marks else 0
                
        elif component_rule_type == 'CUSTOM':
            logic = component_rule_params.get("logic", "")
            for mark in marks_in_category:
                component_score += (mark.marks_obtained*100/mark.max_marks) * logic.get(str(mark.assessment_id), 0)/100
                
            total_score += component_score
        
    return total_score

async def calculate_total_score(student_id: int, course_id: int, policy: PolicyDBObj) -> float:
    
    student_marks = await get_all_marks_for_student_in_course(student_id, course_id)
    
    total_score = execute_policy_calculation(student_marks, policy)
    return total_score
    

def update_total_score_in_db(student_id: int, course_id: int, total_score: float):
    db = get_db()
    if db is None:
        raise Exception("Database connection is not available")
    
    query = """
        INSERT INTO computed_totals (course_id, student_id, total_marks) VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE total_marks = %s
    """
    
    params = (course_id, student_id, total_score, total_score)
    try:
        cursor = db.cursor()
        cursor.execute(query, params)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    
def get_current_total_from_db(student_id: int, course_id: int) -> float | None:
    db = get_db()
    if db is None:
        raise Exception("Database connection is not available")
    
    query = """
        SELECT total_marks FROM computed_totals WHERE student_id = %s AND course_id = %s
    """
    
    params = (student_id, course_id)
    try:
        cursor = db.cursor()
        cursor.execute(query, params)
        result = cursor.fetchone()
        return result[0] if result else None
    except Exception as e:
        raise e

async def update_total_in_db(data: ComputeQueueMessage):
    try:
        policy = get_policy_from_db(data.course_id)
        if not policy:
            print(f"Policy not found for course_id: {data.course_id}")
            return
    except Exception as e:
        print(f"Error retrieving policy for course_id {data.course_id}: {e}")
        return
        
    for student in data.changes:
        student_id = student.student_id
        course_id = data.course_id
        current_total = get_current_total_from_db(student_id, course_id)
        total_score = await calculate_total_score(student_id, course_id, policy)
        
        try:
            update_total_score_in_db(student_id, course_id, total_score)
            body = {
                "course_id": course_id,
                "changes": [{
                    "student_id": student_id,
                    "old_marks": current_total,
                    "new_marks": total_score
                }]
            }
            await publish_message_async('marks_updates', body)
        except Exception as e:
            print(f"Error updating total score for student_id {student_id}, course_id {course_id}: {e}")
            
 