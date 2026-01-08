from services.assessments import get_course_overview_from_db, get_assessment_analytics_from_db
from models.schema.queue import AssessmentQueueMessage
import numpy as np
from utils.db import get_db

def add_course_analytics_to_db(course_id: int, marks: np.array):
    total_students = len(marks)
    mean = np.mean(marks)
    std = np.std(marks)
    median = np.median(marks)
    max = np.max(marks)
    min = np.min(marks)
    
    marks_frequency = np.unique(marks, return_counts=True)
    
    db = get_db()
    if not db:
        raise Exception("Database connection error")
    
    try:
        cursor = db.cursor()
        
        cursor.execute(
            """
            INSERT INTO course_analytics (course_id, total_students, mean, std, median, max, min)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (course_id, total_students, mean, std, median, max, min)
        )
        values = marks_frequency[0].tolist()
        frequencies = marks_frequency[1].tolist()
        
        cursor.executemany(
            """
            INSERT INTO course_mark_frequency (course_id, mark, frequency)
            VALUES (%s, %s, %s)
            """,
            [(course_id, value, frequency) for value, frequency in zip(values, frequencies)]
        )
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Database error: {str(e)}")
    
def update_course_analytics_in_db(course_id: int, new_entries: list, old_entries: list, deleted_entries: list, course_analytic_overview):
    db = get_db()
    if not db:
        raise Exception("Database connection error")
    
    old_mean = course_analytic_overview.mean
    old_std = course_analytic_overview.std
    old_median = course_analytic_overview.median
    old_total_students = course_analytic_overview.total_students
    old_max = course_analytic_overview.max
    old_min = course_analytic_overview.min
    
    new_total_students = old_total_students + len(new_entries) - len(deleted_entries)
    
    recompute_needed = (
        any(mark == old_max for mark in deleted_entries) or
        any(mark == old_min for mark in deleted_entries)
    )
    
    
    old_s = old_mean*old_total_students
    old_q = (old_std**2 + old_mean**2)*old_total_students
    
    new_s = old_s + sum(new_entries) - sum(deleted_entries)
    new_q = old_q + sum([x*x for x in new_entries]) - sum([x*x for x in deleted_entries])
    
    for old, new in old_entries:
        new_s += (new - old)
        new_q += (new*new - old*old)
    
    new_mean = new_s / new_total_students
    new_var = new_q/new_total_students - new_mean**2
    new_std = np.sqrt(max(new_var, 0))
    
    try:
        cursor = db.cursor()
        freq_update = [(course_id, new, 1) for new in new_entries]
        for deleted_mark in deleted_entries:
            freq_update.append((course_id, deleted_mark, -1))
        for old_mark, new_mark in old_entries:
            freq_update.append((course_id, old_mark, -1))
            freq_update.append((course_id, new_mark, 1))
        
        cursor.executemany(
            """
            INSERT INTO course_mark_frequency (course_id, mark, frequency)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE frequency = GREATEST(frequency + VALUES(frequency), 0)
            """,
            freq_update
        )
        
        if recompute_needed:
            candidates = []
            candidates += new_entries
            candidates += [new for old, new in old_entries]
            cursor = db.cursor()
            cursor.execute(
                "SELECT MAX(mark), MIN(mark) FROM course_mark_frequency WHERE course_id = %s",
                (course_id,)
            )
            result = cursor.fetchone()
            if result and result[0] is not None and result[1] is not None:
                candidates.append(result[0])
                candidates.append(result[1])
            new_max = max(candidates) if candidates else 0
            new_min = min(candidates) if candidates else 0
        else:
            new_max_candidates = [old_max]
            new_min_candidates = [old_min]
            if new_entries:
                new_max_candidates.append(max(new_entries))
                new_min_candidates.append(min(new_entries))
            if old_entries:
                new_marks = [new for old, new in old_entries]
                new_max_candidates.append(max(new_marks))
                new_min_candidates.append(min(new_marks))
            new_max = max(new_max_candidates)
            new_min = min(new_min_candidates)
        
        cursor.execute(
            """
            WITH ordered AS (
            SELECT mark,
                    frequency,
                    SUM(frequency) OVER (ORDER BY mark) AS cum_freq,
                    SUM(frequency) OVER () AS total
            FROM course_mark_frequency
            WHERE course_id = %s
            )
            SELECT AVG(mark) AS median
            FROM ordered
            WHERE cum_freq >= total/2
            AND (cum_freq - frequency) < total/2;
            """,
                (course_id,)
        )
        
        median_result = cursor.fetchone()
        new_median = median_result[0] if median_result and median_result[0] is not None else 0
        
        cursor.execute(
            """
            UPDATE course_analytics
            SET total_students = %s, mean = %s, std = %s, median = %s, max = %s, min = %s, version = version + 1
            WHERE course_id = %s
            """,
            (new_total_students, new_mean, new_std, new_median, new_max, new_min, course_id)
        )
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Database error: {str(e)}")

def update_course_analytics(data: AssessmentQueueMessage):
    course_analytic_overview = get_course_overview_from_db(data.course_id)
    if not course_analytic_overview:
        marks = np.array([d.new_marks for d in data.changes])
        add_course_analytics_to_db(data.course_id, marks)
    else:
        new_entry = []
        old_entry = []
        deleted_entry = []
        for change in data.changes:
            if change.old_marks is None:
                new_entry.append(change.new_marks)
            elif change.new_marks is None:
                deleted_entry.append(change.old_marks)
            else:
                old_entry.append((change.old_marks, change.new_marks))
                
        update_course_analytics_in_db(data.course_id, new_entry, old_entry, deleted_entry, course_analytic_overview)

def add_assessment_analytics_to_db(course_id: int, assessment_id: int | None, marks: np.array):
    total_students = len(marks)
    mean = np.mean(marks)
    std = np.std(marks)
    median = np.median(marks)
    max = np.max(marks)
    min = np.min(marks)
    
    marks_frequency = np.unique(marks, return_counts=True)
    
    db = get_db()
    if not db:
        raise Exception("Database connection error")
    
    try:
        cursor = db.cursor()
        
        cursor.execute(
            """
            INSERT INTO assessment_analytics (course_id, assessment_id, total_students, mean, std, median, max, min)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (course_id, assessment_id, total_students, mean, std, median, max, min)
        )
        values = marks_frequency[0].tolist()
        frequencies = marks_frequency[1].tolist()
        
        cursor.executemany(
            """
            INSERT INTO assessment_mark_frequency (course_id, assessment_id, mark, frequency)
            VALUES (%s, %s, %s, %s)
            """,
            [(course_id, assessment_id, value, frequency) for value, frequency in zip(values, frequencies)]
        )
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Database error: {str(e)}")

def update_assessment_analytics_in_db(course_id: int, assessment_id: int | None, new_entries: list, old_entries: list, assessment_analytic_overview):
    db = get_db()
    if not db:
        raise Exception("Database connection error")
    
    old_mean = assessment_analytic_overview.mean
    old_std = assessment_analytic_overview.std
    old_median = assessment_analytic_overview.median
    old_total_students = assessment_analytic_overview.total_students
    old_max = assessment_analytic_overview.max
    old_min = assessment_analytic_overview.min
    m2 = (old_std**2  + old_mean**2) * old_total_students
    
    new_total_students = old_total_students + len(new_entries) 
    new_max_candidates = [old_max]
    new_min_candidates = [old_min]
    if new_entries:
        new_max_candidates.append(max(new_entries))
        new_min_candidates.append(min(new_entries))
    if old_entries:
        old_marks = [old for old, new in old_entries]
        new_max_candidates.append(max(old_marks))
        new_min_candidates.append(min(old_marks))
    new_max = max(new_max_candidates)
    new_min = min(new_min_candidates)
    new_mean = (old_mean * old_total_students + sum(new_entries) + sum([new - old for old, new in old_entries])) / new_total_students
    new_std = np.sqrt((m2 + sum([new**2 - old**2 for old, new in old_entries]) + sum([new**2 for new in new_entries])) / new_total_students - new_mean**2)
    
    try:
        cursor = db.cursor()
        cursor.execute(
            """
            SET @total_rows := (SELECT SUM(frequency) FROM assessment_mark_frequency WHERE course_id = %s AND assessment_id = %s);
            SET @target := @total_rows/2;
            SET @cumulative := 0;
            
            SELECT AVG(mark) AS median
            FROM (
                SELECT MARK, (@cumulative := @cumulative + frequency) AS cumulative_frequency,
                FROM assessment_mark_frequency
                WHERE course_id = %s AND assessment_id = %s
                ORDER BY mark ASC
            ) AS sub
            WHERE cumulative_frequency >= @target
            AND (cumulative_frequency - frequency) < @target;
            """,
            (course_id, assessment_id, course_id, assessment_id)
        )
        
        median_result = cursor.fetchone()
        new_median = median_result[0] if median_result and median_result[0] is not None else 0
        
        cursor.execute(
            """
            UPDATE assessment_analytics
            SET total_students = %s, mean = %s, std = %s, median = %s, max = %s, min = %s, version = version + 1
            WHERE course_id = %s AND assessment_id = %s
            """,
            (new_total_students, new_mean, new_std, new_median, new_max, new_min, course_id, assessment_id)
        )
        
        freq_update = [(course_id, assessment_id, new, 1) for new in new_entries]
        for old_mark, new_mark in old_entries:
            freq_update.append((course_id, assessment_id, old_mark, -1))
            freq_update.append((course_id, assessment_id, new_mark, 1))
            
        cursor.executemany(
            """
            INSERT INTO assessment_mark_frequency (course_id, assessment_id, mark, frequency, version)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE frequency = frequency + VALUES(frequency)
            """,
            freq_update
        )
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Database error: {str(e)}")

def update_assessment_analytics(data: AssessmentQueueMessage):
    assessment_analytics_overview = get_assessment_analytics_from_db(data.course_id, data.assessment_id if data.assessment_id else 0)
    if not assessment_analytics_overview:
        marks = np.array([d.new_marks for d in data.changes])
        add_assessment_analytics_to_db(data.course_id, data.assessment_id, marks)
    else:
        new_entry = []
        old_entry = []
        for change in data.changes:
            if change.old_marks is None:
                new_entry.append(change.new_marks)
            else:
                old_entry.append((change.old_marks, change.new_marks))
                
        update_assessment_analytics_in_db(data.course_id, data.assessment_id, new_entry, old_entry, assessment_analytics_overview)

def update_analytics_in_db(data: AssessmentQueueMessage):
    if data.assessment_id is None:
        update_course_analytics(data)
    else:
        update_assessment_analytics(data)
