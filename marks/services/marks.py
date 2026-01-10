import json, pika
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import status, HTTPException
from utils.db import get_db
from models.schemas.marks import AddMarksRequest
from models.dbobj.marks import MarksDBObj, AllMarksDBObj

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
    
def get_marks_of_students_from_db(assessment_id: int, studentids: list[int]):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
        
    try:
        cursor = db.cursor()
        query = """
            SELECT student_id, marks_obtained, recorded_by_id, updated_at
            FROM marks
            WHERE assessment_id = %s AND student_id IN ({placeholders})
        """
        
        cursor.execute(query, (assessment_id, *studentids))
        results = cursor.fetchall()
        
        marks = [
            MarksDBObj(
                student_id=row[0],
                marks_obtained=row[1],
                recorded_by_id=row[2],
                updated_at=row[3]
            )
            for row in results
        ]
        
        return marks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve marks from the database : {e}"
        )

async def add_marks_to_db(course_id: int, assessment_id: int, data: AddMarksRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            INSERT INTO marks (
                assessment_id, student_id, marks_obtained,
                recorded_by_id, updated_at
            )
            VALUES (%s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                marks_obtained = VALUES(marks_obtained),
                recorded_by_id = VALUES(recorded_by_id),
                updated_at = NOW()
        """
        
        values = [
            (
                assessment_id,
                mark.student_id,
                mark.marks_obtained,
                data.recorded_by_id
            )
            for mark in data.marks
        ]
        student_ids = [mark.student_id for mark in data.marks]
        old_marks = get_marks_of_students_from_db(assessment_id, student_ids)
        old_marks_dict = {(mark.student_id): mark.marks_obtained for mark in old_marks}
        cursor.executemany(query, values)
        db.commit()
        body = {
            "course_id": course_id,
            "assessment_id": assessment_id,
            "changes": []
        }
        for marks in data.marks:
            body["changes"].append({
                "student_id": marks.student_id,
                "old_marks": old_marks_dict.get(marks.student_id, None),
                "new_marks": marks.marks_obtained
            })
            
        # Publish message asynchronously
        await publish_message_async('marks_updates', body)

        return True
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add marks to the database : {e}"
        )
        
def get_marks_from_db(assessment_id: int, student_id: int | None = None):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            SELECT student_id, marks_obtained, recorded_by_id, updated_at
            FROM marks
            WHERE assessment_id = %s AND student_id = COALESCE(%s, student_id)
        """
        
        cursor.execute(query, (assessment_id, student_id))
        results = cursor.fetchall()
        
        marks = [
            MarksDBObj(
                student_id=row[0],
                marks_obtained=row[1],
                recorded_by_id=row[2],
                updated_at=row[3]
            )
            for row in results
        ]
        
        return marks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve marks from the database : {e}"
        )
        
async def delete_marks_from_db(course_id: int, assessment_id: int, student_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            DELETE FROM marks
            WHERE assessment_id = %s AND student_id = %s
        """
        
        old_mark = get_marks_from_db(assessment_id, student_id)
        if not old_mark:
            return False
        
        body = {
            "course_id": course_id,
            "assessment_id": assessment_id,
            "changes": [{
                "student_id": student_id,
                "old_marks": old_mark[0].marks_obtained,
                "new_marks": None
            }]
        }
        
        cursor.execute(query, (assessment_id, student_id))
        db.commit()
        
        # Publish message asynchronously
        await publish_message_async('marks_updates', body)
        
        return cursor.rowcount > 0
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete marks from the database : {e}"
        )
        
def publish_marks_in_db(assessment_id: int, publish: bool):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            UPDATE assessments
            SET is_marks_published = %s
            WHERE id = %s
        """
        
        cursor.execute(query, (publish, assessment_id))
        db.commit()
        
        return cursor.rowcount > 0
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update marks publication status in the database : {e}"
        )
        
def get_all_marks_from_db(student_id: int, course_id: int, check_published: bool = True):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            SELECT m.assessment_id, m.marks_obtained, m.recorded_by_id, m.updated_at, a.name, a.assessment_type_id, a.max_marks, a.assessment_date
            FROM marks m
            JOIN assessments a ON m.assessment_id = a.id
            WHERE a.course_id = %s AND m.student_id = %s AND a.is_marks_published = COALESCE(%s, a.is_marks_published)
            ORDER BY a.assessment_date DESC
        """
        
        cursor.execute(query, (course_id, student_id, None if check_published == False else True))
        results = cursor.fetchall()
        
        marks = [
            AllMarksDBObj(
                assessment_id=row[0],
                marks_obtained=row[1],
                recorded_by_id=row[2],
                updated_at=row[3],
                assessment_name=row[4],
                assessment_type_id=row[5],
                max_marks=row[6],
                assessment_date=row[7]
            )
            for row in results
        ]
        
        return marks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve all marks from the database : {e}"
        )
        
def MarksPublished(assessment_id: int) -> bool:
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        cursor.execute(
            "SELECT is_marks_published FROM assessments WHERE id = %s",
            (assessment_id,)
        )
        result = cursor.fetchone()
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found"
            )
        return result[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )