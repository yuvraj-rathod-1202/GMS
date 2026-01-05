CREATE USER IF NOT EXISTS 'mms_user'@'%' IDENTIFIED BY 'MmsUserPass123';

CREATE DATABASE IF NOT EXISTS analytics;

GRANT ALL PRIVILEGES ON analytics.* TO 'mms_user'@'%';

USE analytics;

CREATE TABLE IF NOT EXISTS course_analytics (
    id UUID PRIMARY KEY,
    course_id INT NOT NULL,

    mean DECIMAL(5,2) NOT NULL,
    median DECIMAL(5,2) NOT NULL,
    mode DECIMAL(5,2) NOT NULL,
    max DECIMAL(5,2) NOT NULL,
    min DECIMAL(5,2) NOT NULL,
    std DECIMAL(5,2) NOT NULL,
    total_students INT NOT NULL,

    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID PRIMARY KEY,
    course_id INT NOT NULL,
    assessment_id INT NOT NULL,

    mean DECIMAL(5,2) NOT NULL,
    median DECIMAL(5,2) NOT NULL,
    mode DECIMAL(5,2) NOT NULL,
    max DECIMAL(5,2) NOT NULL,
    min DECIMAL(5,2) NOT NULL,
    std DECIMAL(5,2) NOT NULL,

    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assessment_range (
    id UUID PRIMARY KEY,
    assessment_id INT NOT NULL,
    range_start DECIMAL(5,2) NOT NULL,
    range_end DECIMAL(5,2) NOT NULL,
    student_count INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INDEX idx_course_assessment ON assessment_analytics (course_id, assessment_id);
INDEX idx_course ON course_analytics (course_id);