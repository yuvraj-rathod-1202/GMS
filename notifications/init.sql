CREATE USER IF NOT EXISTS 'mms_user'@'%' IDENTIFIED BY 'MmsUserPass123';

CREATE DATABASE IF NOT EXISTS notifications;

GRANT ALL PRIVILEGES ON notifications.* TO 'mms_user'@'%';

USE notifications;

CREATE TABLE IF NOT EXISTS notification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(10) NOT NULL,
    event VARCHAR(100) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS userid_email_map (
    user_id INT PRIMARY KEY,
    email VARCHAR(255) NOT NULL
);

CREATE INDEX idx_user_id ON notification_logs(user_id);
CREATE INDEX idx_type ON notification_logs(type);