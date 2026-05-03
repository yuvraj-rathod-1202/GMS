CREATE USER IF NOT EXISTS 'mms_user'@'%' IDENTIFIED BY 'MmsUserPass123';

CREATE DATABASE IF NOT EXISTS marks;

GRANT ALL PRIVILEGES ON marks.* TO 'mms_user'@'%';

USE marks;

CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    assessment_type_id INT NOT NULL,
    max_marks FLOAT NOT NULL,
    is_marks_published BOOLEAN DEFAULT FALSE,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained INT NOT NULL,
    recorded_by_id INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assessment_student (assessment_id, student_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_assessment_id (assessment_id),
    
);

CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    current_mark INT NOT NULL,
    challenge_type VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    resolution_details TEXT,
    resolved_by_id INT NOT NULL,
    raised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

DELIMITER $$

CREATE TRIGGER before_marks_insert
BEFORE INSERT ON marks
FOR EACH ROW
BEGIN
    DECLARE max_m FLOAT;

    SELECT max_marks
    INTO max_m
    FROM assessments
    WHERE id = NEW.assessment_id;

    IF NEW.marks_obtained > max_m THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Marks exceed maximum allowed';
    END IF;
END$$

DELIMITER ;