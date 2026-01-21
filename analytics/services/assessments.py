import os
import logging
from fastapi import HTTPException, status
from utils.db import get_db
from models.dbobj.assessments import CourseOverviewBDObj, AssessmentAnalyticsBDObj, AssessmentMarkFrequencyBDObj
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development').lower() == 'production'

def get_course_overview_from_db(course_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        query = "SELECT id, course_id, mean, median, max, min, std, total_students, computed_at, version FROM course_analytics WHERE course_id = %s"
        
        cursor.execute(query, (course_id,))
        overview = cursor.fetchone()
        return CourseOverviewBDObj(id=overview[0], course_id=overview[1], mean=overview[2], median=overview[3], max=overview[4], min=overview[5], std=overview[6], total_students=overview[7], computed_at=overview[8], version=overview[9]) if overview else None
    except Exception as e:
        logger.error(f"Database error in get_course_overview_from_db: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving course overview" if IS_PRODUCTION else f"Database error: {str(e)}"
        )
        
def get_assessment_analytics_from_db(course_id: int, assessment_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        query = "SELECT id, course_id, assessment_id, mean, median, max, min, std, total_students, computed_at, version FROM assessment_analytics WHERE course_id = %s AND assessment_id = %s"
        
        cursor.execute(query, (course_id, assessment_id))
        analytics = cursor.fetchone()
        return AssessmentAnalyticsBDObj(id=analytics[0], course_id=analytics[1], assessment_id=analytics[2], mean=analytics[3], median=analytics[4], max=analytics[5], min=analytics[6], std=analytics[7], total_students=analytics[8], computed_at=analytics[9], version=analytics[10]) if analytics else None
    except Exception as e:
        logger.error(f"Database error in get_assessment_analytics_from_db: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving assessment analytics" if IS_PRODUCTION else f"Database error: {str(e)}"
        )
        
def get_assessment_frequencies_from_db(course_id: int, assessment_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        query = """
        SELECT id, course_id, assessment_id, mark, frequency, computed_at FROM assessment_mark_frequency 
        WHERE course_id = %s AND assessment_id = %s AND frequency > 0
        ORDER BY mark ASC
        """
        
        cursor.execute(query, (course_id, assessment_id))
        frequencies = cursor.fetchall()
        
        frequency_objs = []
        for freq_record in frequencies:
            frequency_objs.append(
                AssessmentMarkFrequencyBDObj(
                    id=freq_record[0],
                    course_id=freq_record[1],
                    assessment_id=freq_record[2],
                    mark=freq_record[3],
                    frequency=freq_record[4],
                    computed_at=freq_record[5]
                )
            )
        
        return frequency_objs
    except Exception as e:
        logger.error(f"Database error in get_assessment_frequencies_from_db: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving assessment frequency data" if IS_PRODUCTION else f"Database error: {str(e)}"
        )