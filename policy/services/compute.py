from utils.db import get_db
from models.schema.compute import ComputeQueueMessage, AllMarksDBObj
from models.dbobj.policy import PolicyDBObj
from services.policy import get_policy_from_db
import httpx, os
from dotenv import load_dotenv

load_dotenv()

async def get_all_marks_for_student_in_course(student_id: int, course_id: int) -> list[AllMarksDBObj]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{os.getenv('MARKS_SERVICE_URL')}/{course_id}/marks/all/{student_id}",
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
        
        marks_in_category = [mark for mark in student_marks if mark.assessment_type == component.assessment_category_id]
        
        if component_rule_type == "ALL":
            for mark in marks_in_category:
                component_score += mark.marks_obtained*100/mark.max_marks
            total_score += (component_score * component_total_weightage) / 100
                
        elif component_rule_type == "BEST_N":
            n = component_rule_params.get("n", 0)
            sorted_marks = sorted(marks_in_category, key=lambda x: (x.marks_obtained*100)/x.max_marks, reverse=True)
            best_n_marks = sorted_marks[:n]
            for mark in best_n_marks:
                component_score += mark.marks_obtained*100/mark.max_marks
            total_score += (component_score * component_total_weightage) / 100
                
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
        
        total_score = await calculate_total_score(student_id, course_id, policy)
        
        try:
            update_total_score_in_db(student_id, course_id, total_score)
        except Exception as e:
            print(f"Error updating total score for student_id {student_id}, course_id {course_id}: {e}")
            
    
    