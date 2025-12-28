from fastapi import HTTPException, status
from utils.db import get_db
from models.schemas.assessments import CreateAssessmentRequest, UpdateAssessmentRequest
from models.dbobj.assessments import AssessmentsBDObj

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
            INSERT INTO assessments (course_id, name, assessment_type, max_marks, is_marks_published, assessment_date, created_by_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """
        
        cursor.execute(insert_query, (
            course_id,
            data.name,
            data.assessment_type,
            data.max_marks,
            data.is_marks_published,
            data.assessment_date,
            data.email
        ))
        db.commit()
        assessment_id = cursor.fetchone()[0]
        return assessment_id
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
            SELECT id, course_id, name, assessment_type, max_marks,
                is_marks_published, assessment_date, created_by_email,
                created_at, updated_at
            FROM assessments
            WHERE course_id = %s
            ORDER BY updated_at DESC
        """
        params = [course_id]

        if assessment_id is not None:
            select_query += " AND id = %s"
            params.append(assessment_id)

        cursor.execute(select_query, tuple(params))
        rows = cursor.fetchall()
        
        assessments = []
        for row in rows:
            assessments.append(AssessmentsBDObj(
                id=row[0],
                course_id=row[1],
                name=row[2],
                assessment_type=row[3],
                max_marks=row[4],
                is_marks_published=row[5],
                assessment_date=row[6],
                created_by_email=row[7],
                created_at=row[8],
                updated_at=row[9]
            ))
        
        return assessments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
        if data.assessment_type is not None:
            fields.append("assessment_type = %s")
            values.append(data.assessment_type)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )