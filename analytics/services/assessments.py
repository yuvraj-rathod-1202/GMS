import os
import logging
import MySQLdb
from fastapi import HTTPException, status
from utils.db import get_db
from models.dbobj.assessments import CourseOverviewBDObj, AssessmentAnalyticsBDObj, AssessmentMarkFrequencyBDObj, SystemOverviewBDObj
from datetime import datetime
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

def get_system_overview_from_db():
    db_host = os.getenv("DB_HOST")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_port = int(os.getenv("DB_PORT", 3306))

    try:
        courses_db = MySQLdb.connect(
            host=db_host,
            user=db_user,
            passwd=db_password,
            db="courses",
            port=db_port,
        )
        courses_cursor = courses_db.cursor()
        
        # Get course statistics
        courses_cursor.execute(
            "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as active, "
            "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM courses"
        )
        course_stats = courses_cursor.fetchone()
        total_courses = course_stats[0] or 0
        active_courses = course_stats[1] or 0
        inactive_courses = course_stats[2] or 0
        
        # Get unique students count (from courses_role where role = 'student')
        courses_cursor.execute(
            "SELECT COUNT(DISTINCT user_id) FROM courses_role WHERE role = 'student'"
        )
        total_students = courses_cursor.fetchone()[0] or 0
        
        # Get unique instructors count
        courses_cursor.execute(
            "SELECT COUNT(DISTINCT user_id) FROM courses_role WHERE role = 'instructor'"
        )
        total_instructors = courses_cursor.fetchone()[0] or 0
        
        courses_cursor.close()
        courses_db.close()
        
        marks_db = MySQLdb.connect(
            host=db_host,
            user=db_user,
            passwd=db_password,
            db="marks",
            port=db_port,
        )
        marks_cursor = marks_db.cursor()
        
        # Get total assessments
        marks_cursor.execute("SELECT COUNT(*) FROM assessments")
        total_assessments = marks_cursor.fetchone()[0] or 0
        
        # Get average student grade
        marks_cursor.execute(
            "SELECT AVG(marks_obtained / (SELECT max_marks FROM assessments a WHERE a.id = m.assessment_id)) * 100 as avg_grade "
            "FROM marks m"
        )
        result = marks_cursor.fetchone()
        average_student_grade = result[0] if result and result[0] else 0.0
        
        marks_cursor.close()
        marks_db.close()
        
        return SystemOverviewBDObj(
            total_courses=total_courses,
            active_courses=active_courses,
            inactive_courses=inactive_courses,
            total_students=total_students,
            total_instructors=total_instructors,
            total_assessments=total_assessments,
            average_student_grade=round(average_student_grade, 2),
            computed_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Database error in get_system_overview_from_db: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving system overview" if IS_PRODUCTION else f"Database error: {str(e)}"
        )