from fastapi import HTTPException, status
from utils.db import get_db
from models.schemas.assessments import CreateAssessmentRequest, UpdateAssessmentRequest
from models.dbobj.assessments import AssessmentsBDObj
from dotenv import load_dotenv
import os, logging

load_dotenv()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

def add_assessment_to_db(course_id: int, data: CreateAssessmentRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        insert_query = """
            INSERT INTO assessments (course_id, name, assessment_type_id, max_marks, is_marks_published, assessment_date, created_by_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            course_id,
            data.name,
            data.assessment_type_id,
            data.max_marks,
            data.is_marks_published,
            data.assessment_date,
            data.user_id
        ))
        db.commit()
        assessment_id = cursor.lastrowid
        return assessment_id
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while adding assessment" if IS_PRODUCTION else f"Database error: {str(e)}"
        )
        
def get_all_assessments_from_db(course_id: int, assessment_id: int | None = None):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        select_query = """
            SELECT id, course_id, name, assessment_type_id, max_marks,
                is_marks_published, assessment_date, created_by_id,
                created_at, updated_at
            FROM assessments
            WHERE course_id = %s
        """
        params = [course_id]

        if assessment_id is not None:
            select_query += " AND id = %s"
            params.append(assessment_id)
            
        select_query += " ORDER BY created_at DESC"

        cursor.execute(select_query, tuple(params))
        rows = cursor.fetchall()
        
        assessments = []
        for row in rows:
            assessments.append(AssessmentsBDObj(
                id=row[0],
                course_id=row[1],
                name=row[2],
                assessment_type_id=row[3],
                max_marks=row[4],
                is_marks_published=row[5],
                assessment_date=row[6],
                created_by_id=row[7],
                created_at=row[8],
                updated_at=row[9]
            ))
        
        return assessments
    except Exception as e:
        logger.error(f"Database error in get_all_assessments_from_db: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving assessments" if IS_PRODUCTION else f"Database error: {str(e)}"
        )
        
def update_assessment_in_db(course_id: int, assessment_id: int, data: UpdateAssessmentRequest):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        fields = []
        values = []
        if data.name is not None:
            fields.append("name = %s")
            values.append(data.name)
        if data.assessment_type_id is not None:
            fields.append("assessment_type_id = %s")
            values.append(data.assessment_type_id)
        if data.max_marks is not None:
            fields.append("max_marks = %s")
            values.append(data.max_marks)
        if data.is_marks_published is not None:
            fields.append("is_marks_published = %s")
            values.append(data.is_marks_published)
        if data.assessment_date is not None:
            fields.append("assessment_date = %s")
            values.append(data.assessment_date)
        if not fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
            
        values.append(course_id)
        
        values.append(assessment_id)
        
        update_query = f"""
            UPDATE assessments
            SET {', '.join(fields)}, updated_at = NOW()
            WHERE course_id = %s AND id = %s
        """
        
        cursor = db.cursor()
        cursor.execute(update_query, tuple(values))
        db.commit()
        
        return cursor.rowcount > 0
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating assessment" if IS_PRODUCTION else f"Database error: {str(e)}"
        )
        
def delete_assessment_from_db(course_id: int, assessment_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        delete_query = """
            DELETE FROM assessments
            WHERE course_id = %s AND id = %s
        """
        
        cursor.execute(delete_query, (course_id, assessment_id))
        db.commit()
        
        return cursor.rowcount > 0
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting assessment" if IS_PRODUCTION else f"Database error: {str(e)}"
        )

def fetch_system_wide_assessments(limit: int = 50, offset: int = 0):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    try:
        cursor = db.cursor()
        select_query = """
            SELECT id, course_id, name, assessment_type_id, max_marks,
                is_marks_published, assessment_date, created_by_id,
                created_at, updated_at
            FROM assessments
            ORDER BY created_at DESC LIMIT %s OFFSET %s
        """
        cursor.execute(select_query, (limit, offset))
        rows = cursor.fetchall()
        
        assessments = []
        for row in rows:
            assessments.append({
                "id": row[0],
                "course_id": row[1],
                "name": row[2],
                "assessment_type_id": row[3],
                "max_marks": row[4],
                "is_marks_published": row[5],
                "assessment_date": row[6],
                "created_by_id": row[7],
                "created_at": row[8],
                "updated_at": row[9]
            })
        
        return assessments
    except Exception as e:
        logger.error(f"Database error in fetch_system_wide_assessments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving assessments" if IS_PRODUCTION else f"Database error: {str(e)}"
        )