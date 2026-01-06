from fastapi import HTTPException, status
from utils.db import get_db
from models.dbobj.assessments import AssessmentRangeBDObj, CourseOverviewBDObj, AssessmentAnalyticsBDObj

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
        overview = cursor.fetchall()
        return CourseOverviewBDObj(id=overview[0], course_id=overview[1], mean=overview[2], median=overview[3], max=overview[4], min=overview[5], std=overview[6], total_students=overview[7], computed_at=overview[8], version=overview[9]) if overview else None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
        query = "SELECT id, course_id, assessment_id, mean, median, max, min, std, computed_at, version FROM assessment_analytics WHERE course_id = %s AND assessment_id = %s"
        
        cursor.execute(query, (course_id, assessment_id))
        analytics = cursor.fetchall()
        return AssessmentAnalyticsBDObj(id=analytics[0], course_id=analytics[1], assessment_id=analytics[2], mean=analytics[3], median=analytics[4], max=analytics[5], min=analytics[6], std=analytics[7], computed_at=analytics[8], version=analytics[9]) if analytics else None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
        
def get_assessment_range_from_db(course_id: int, assessment_id: int):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )
    
    try:
        cursor = db.cursor()
        query = """
        SELECT id, course_id, assessment_id, range_start, range_end, student_count, percentage, computed_at, version FROM assessment_range 
        WHERE course_id = %s AND assessment_id = %s
        ORDER BY range_start ASC
        """
        
        cursor.execute(query, (course_id, assessment_id))
        ranges = cursor.fetchall()
        
        range_objs = []
        for range_record in ranges:
            range_objs.append(AssessmentRangeBDObj(
                id=range_record[0],
                course_id=range_record[1],
                assessment_id=range_record[2],
                range_start=range_record[3],
                range_end=range_record[4],
                student_count=range_record[5],
                percentage=range_record[6],
                computed_at=range_record[7],
                version=range_record[8]
            ))
        
        return range_objs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
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
        SELECT id, course_id, assessment_id, score, student_count, percentage, computed_at, version FROM assessment_frequencies 
        WHERE course_id = %s AND assessment_id = %s
        ORDER BY score ASC
        """
        
        cursor.execute(query, (course_id, assessment_id))
        frequencies = cursor.fetchall()
        
        frequency_objs = []
        for freq_record in frequencies:
            frequency_objs.append({
                "id": freq_record[0],
                "course_id": freq_record[1],
                "assessment_id": freq_record[2],
                "score": freq_record[3],
                "student_count": freq_record[4],
                "computed_at": freq_record[6],
                "version": freq_record[7]
            })
        
        return frequency_objs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )