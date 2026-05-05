import pytest
from services.queue import update_analytics_in_db
from models.schema.queue import AssessmentQueueMessage, ChangedMarks
from unittest.mock import patch

@patch('services.queue.update_course_analytics')
@patch('services.queue.update_assessment_analytics')
def test_update_analytics_in_db(mock_update_assessment, mock_update_course, mock_db):
    # Create dummy data
    message = AssessmentQueueMessage(
        course_id=1,
        assessment_id=1,
        changes=[
            ChangedMarks(student_id=1, old_marks=80.0, new_marks=85.0),
            ChangedMarks(student_id=2, old_marks=None, new_marks=90.0),
            ChangedMarks(student_id=3, old_marks=70.0, new_marks=None)
        ]
    )
    
    update_analytics_in_db(message)
    
    # Assert that it delegates to the sub-functions correctly based on assessment_id
    mock_update_course.assert_not_called()
    mock_update_assessment.assert_called_once_with(message)
    
    # Test for course analytics (assessment_id is None)
    message.assessment_id = None
    update_analytics_in_db(message)
    mock_update_course.assert_called_once_with(message)
