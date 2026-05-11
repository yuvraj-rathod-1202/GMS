CREATE USER 'gms_user'@'%' IDENTIFIED BY 'GmsUserPass123';

CREATE DATABASE auth;

GRANT ALL PRIVILEGES ON auth.* TO 'gms_user'@'%';

USE auth;

CREATE TABLE users (
    id INT PRIMARY KEY,
    google_id VARCHAR(256) NULL UNIQUE,
    password_hash VARCHAR(256) NULL,
    email VARCHAR(128) NOT NULL UNIQUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_id_map (
    email VARCHAR(128) PRIMARY KEY,
    id INT NOT NULL UNIQUE
);

CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);