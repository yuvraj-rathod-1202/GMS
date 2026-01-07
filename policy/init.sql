CREATE USER IF NOT EXISTS 'mms_user'@'%' IDENTIFIED BY 'MmsUserPass123';

CREATE DATABASE IF NOT EXISTS policy;

GRANT ALL PRIVILEGES ON policy.* TO 'mms_user'@'%';

USE policy;

CREATE TABLE IF NOT EXISTS course_policy (
    id UUID PRIMARY KEY,
    course_id INT NOT NULL UNIQUE,
    total_weightage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    set_by_id INT NOT NULL,
    updated_by_id INT NOT NULL,
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_category (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
);

CREATE TYPE IF NOT EXISTS rule_type_enum AS ENUM (
    'ALL',
    'BEST_N',
    'CUSTOM',
);

CREATE TABLE IF NOT EXISTS grading_components (
    id UUID PRIMARY KEY,
    course_policy_id UUID NOT NULL,
    assessment_category_id UUID NOT NULL,
    weightage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grading_rule (
    id UUID PRIMARY KEY,
    grading_component_id UUID NOT NULL,
    rule_type rule_type_enum NOT NULL DEFAULT 'ALL',
    rule_params JSONB NOT NULL,
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

INSERT INTO assessment_category (id, type) VALUES
    (UUID(), 'Quiz'),
    (UUID(), 'Assignment'),
    (UUID(), 'Midsem'),
    (UUID(), 'Endsem'),
    (UUID(), 'Project'),
    (UUID(), 'Attendance'),
    (UUID(), 'Lab');
