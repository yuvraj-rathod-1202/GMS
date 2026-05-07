CREATE DATABASE IF NOT EXISTS feature_flags;

GRANT ALL PRIVILEGES ON feature_flags.* TO 'gms_user'@'%';

USE feature_flags;

-- Flag Definitions (Global or Template for Course/User flags)
CREATE TABLE IF NOT EXISTS feature_flag_definitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type ENUM('boolean', 'percentage', 'user_based', 'time_based') NOT NULL DEFAULT 'boolean',
    scope_level ENUM('global', 'course') NOT NULL DEFAULT 'global',
    default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    default_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1
);

-- Overrides for specific scopes (e.g., Course Overrides)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag_id INT NOT NULL,
    scope_id VARCHAR(100) NOT NULL, -- e.g., course_id
    enabled BOOLEAN NOT NULL,
    config JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    FOREIGN KEY (flag_id) REFERENCES feature_flag_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_flag_scope (flag_id, scope_id)
);

CREATE TABLE IF NOT EXISTS flag_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag_definition_id INT,
    flag_override_id INT,
    action ENUM('create', 'update', 'delete') NOT NULL,
    old_value JSON,
    new_value JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed definitions
INSERT INTO feature_flag_definitions (name, description, type, scope_level, default_enabled) VALUES 
('course.assessment_analytics', 'Allows students to view assessment-level analytics (mean, median, etc.)', 'boolean', 'course', FALSE),
('course.total_marks_visibility', 'Allows students to see their running total marks for the course', 'boolean', 'course', TRUE),
('course.ta_assessment_management', 'Grants TAs permission to create/edit/delete assessments', 'boolean', 'course', FALSE),
('course.ta_policy_management', 'Grants TAs permission to manage course grading policies', 'boolean', 'course', FALSE),
('course.ta_analytics_visibility', 'Allows TAs to view course-level analytics', 'boolean', 'course', TRUE);
