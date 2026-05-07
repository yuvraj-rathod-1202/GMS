CREATE USER IF NOT EXISTS 'gms_user'@'%' IDENTIFIED BY 'GmsUserPass123';

CREATE DATABASE IF NOT EXISTS policy;

GRANT ALL PRIVILEGES ON policy.* TO 'gms_user'@'%';

USE policy;

CREATE TABLE IF NOT EXISTS course_policy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    total_weightage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    set_by_id INT NOT NULL,
    updated_by_id INT NOT NULL,
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_course_policy (course_id, policy_name)
);

CREATE TABLE IF NOT EXISTS assessment_category (
    id int AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS grading_components (
    id int AUTO_INCREMENT PRIMARY KEY,
    course_policy_id int NOT NULL,
    assessment_category_id int NOT NULL,
    weightage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_course_assessment (course_policy_id, assessment_category_id),
    FOREIGN KEY (course_policy_id) REFERENCES course_policy(id)
);

CREATE TABLE IF NOT EXISTS grading_rule (
    id int AUTO_INCREMENT PRIMARY KEY,
    grading_component_id int NOT NULL,
    rule_type ENUM(
        'CUMULATIVE',
        'EQUAL_WEIGHTAGE',
        'BEST_N',
        'CUSTOM'
    ) NOT NULL DEFAULT 'CUMULATIVE',
    rule_params JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS student_course_policy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    course_policy_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by_id INT NOT NULL,
    UNIQUE KEY unique_student_course (student_id, course_id),
    FOREIGN KEY (course_policy_id) REFERENCES course_policy(id)
);

CREATE TABLE IF NOT EXISTS computed_totals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    total_marks FLOAT NOT NULL,
    final_grade VARCHAR(10),
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_course_student (course_id, student_id)
);

INSERT INTO assessment_category (type) VALUES
    ('Quiz'),
    ('Assignment'),
    ('Midsem'),
    ('Endsem'),
    ('Project'),
    ('Attendance'),
    ('Lab'),
    ('Other');
