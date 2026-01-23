CREATE USER IF NOT EXISTS 'mms_user'@'%' IDENTIFIED BY 'MmsUserPass123';

-- Auth Database
CREATE DATABASE auth;

GRANT ALL PRIVILEGES ON auth.* TO 'mms_user'@'%';

USE auth;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    password_hash VARCHAR(256) NOT NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users (email);
CREATE INDEX idx_id ON users (id);

-- Courses Database
CREATE DATABASE IF NOT EXISTS courses;
GRANT ALL PRIVILEGES ON courses.* TO 'mms_user'@'%';

USE courses;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses_role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS id_email_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin (user_id) VALUES (24110293) ON DUPLICATE KEY UPDATE user_id=user_id;

CREATE INDEX idx_course_id ON courses_role (course_id);
CREATE INDEX idx_user_id ON courses_role (user_id);
CREATE INDEX idx_course_id ON courses (id);
CREATE INDEX idx_id_email ON id_email_map (user_id);

-- Marks Database
CREATE DATABASE IF NOT EXISTS marks;

GRANT ALL PRIVILEGES ON marks.* TO 'mms_user'@'%';

USE marks;

CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    assessment_type_id INT NOT NULL,
    max_marks INT NOT NULL,
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
    DECLARE max_m INT;

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

CREATE INDEX idx_assessment ON marks (assessment_id);
CREATE INDEX idx_student ON marks (student_id);
CREATE INDEX idx_course ON assessments (course_id);
CREATE INDEX idx_assessment ON assessments (id);

-- Policy Database
CREATE DATABASE IF NOT EXISTS policy;

GRANT ALL PRIVILEGES ON policy.* TO 'mms_user'@'%';

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
    ('Lab');

CREATE INDEX idx_course_policy ON course_policy (course_id);
CREATE INDEX idx_student_course ON student_course_policy (student_id, course_id);
CREATE INDEX idx_course_student ON computed_totals (course_id, student_id);

-- Analytics Database
CREATE DATABASE IF NOT EXISTS analytics;

GRANT ALL PRIVILEGES ON analytics.* TO 'mms_user'@'%';

USE analytics;

CREATE TABLE IF NOT EXISTS course_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,

    mean DECIMAL(5,2) NOT NULL,
    median DECIMAL(5,2) NOT NULL,
    max DECIMAL(5,2) NOT NULL,
    min DECIMAL(5,2) NOT NULL,
    std DECIMAL(5,2) NOT NULL,
    total_students INT NOT NULL,

    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assessment_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    assessment_id INT NOT NULL,

    mean DECIMAL(5,2) NOT NULL,
    median DECIMAL(5,2) NOT NULL,
    max DECIMAL(5,2) NOT NULL,
    min DECIMAL(5,2) NOT NULL,
    std DECIMAL(5,2) NOT NULL,
    total_students INT NOT NULL,

    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS course_mark_frequency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    mark DECIMAL(5,2) NOT NULL,
    frequency INT NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_course_mark (course_id, mark)
);

CREATE TABLE IF NOT EXISTS assessment_mark_frequency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    assessment_id INT NOT NULL,
    mark DECIMAL(5,2) NOT NULL,
    frequency INT NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_assessment_mark (assessment_id, mark)
);

CREATE INDEX idx_course_assessment ON assessment_analytics (course_id, assessment_id);
CREATE INDEX idx_course ON course_analytics (course_id);
CREATE INDEX idx_course_mark ON course_mark_frequency (course_id);
CREATE INDEX idx_assessment_mark ON assessment_mark_frequency (assessment_id);