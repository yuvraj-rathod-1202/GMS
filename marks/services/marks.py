from fastapi import status, HTTPException
from utils.db import get_db
from models.schemas.marks import AddMarksRequest
from models.dbobj.marks import MarksDBObj, AllMarksDBObj

def add_marks_to_db(assessment_id: int, data: AddMarksRequest):
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
        
        cursor.executemany(query, values)
        db.commit()
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
        
def delete_marks_from_db(assessment_id: int, student_id: int):
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
        
        cursor.execute(query, (assessment_id, student_id))
        db.commit()
        
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
        
def get_all_marks_from_db(student_id: int, course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        
        query = """
            SELECT m.assessment_id, m.marks_obtained, m.recorded_by_id, m.updated_at, a.name, a.assessment_type, a.max_marks, a.assessment_date
            FROM marks m
            JOIN assessments a ON m.assessment_id = a.id
            WHERE a.course_id = %s AND m.student_id = %s AND a.is_marks_published = TRUE
            ORDER BY a.assessment_date DESC
        """
        
        cursor.execute(query, (course_id, student_id))
        results = cursor.fetchall()
        
        marks = [
            AllMarksDBObj(
                assessment_id=row[0],
                marks_obtained=row[1],
                recorded_by_id=row[2],
                updated_at=row[3],
                assessment_name=row[4],
                assessment_type=row[5],
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