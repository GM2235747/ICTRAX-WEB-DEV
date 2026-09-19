CREATE DATABASE IF NOT EXISTS ictrax_db;
USE ictrax_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','student') NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    title VARCHAR(150) NULL,
    initials VARCHAR(10) NULL,
    student_id VARCHAR(50) NULL,
    course VARCHAR(100) NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    UNIQUE KEY uq_student_id (student_id)
);

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    serial_number VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL,
    condition_status VARCHAR(50) NOT NULL,
    date_acquired DATE NOT NULL,
    last_maintenance DATE NOT NULL,
    notes TEXT,
    created_by_user_id INT NULL,
    updated_by_user_id INT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_equipment_serial_location (serial_number, location),
    INDEX idx_equipment_status (status),
    INDEX idx_equipment_location (location)
);

CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    reported_by_user_id INT NULL,
    reported_by_name VARCHAR(150) NOT NULL,
    reported_by_course VARCHAR(100) NULL,
    date_reported DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    remarks TEXT NULL,
    resolved_date DATE NULL,
    created_by_user_id INT NULL,
    updated_by_user_id INT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id),
    INDEX idx_incidents_status (status),
    INDEX idx_incidents_priority (priority),
    INDEX idx_incidents_date_reported (date_reported)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_entity (entity_type, entity_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS equipment_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_builtin TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    is_builtin TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO equipment_categories (name, is_builtin) VALUES
('Desktop Computer', 1), ('Monitor', 1), ('Keyboard', 1), ('Mouse', 1),
('UPS', 1), ('Projector', 1), ('Printer', 1), ('Router/Switch', 1),
('Webcam', 1), ('Headset', 1);

INSERT IGNORE INTO equipment_locations (name, is_builtin) VALUES
('Computer Laboratory 1', 1), ('Computer Laboratory 2', 1),
('Computer Laboratory 3', 1), ('Server Room', 1);

INSERT INTO users (username, password_hash, role, full_name, title, initials, student_id, course)
VALUES
('admin.tech', '$2y$10$9ydj3pKDjwCAuFz.Lqw2gO3/XP/ebfntK4XDdMcaLMVvPt2TQ2mdu', 'admin', 'Ramon Cruz', 'ICT Laboratory Technician', 'RC', NULL, NULL),
('jdelacruz', '$2y$10$3ynLnhoJFVKL.oboJEjKquh9v49F8IpG3HuFRw8J0Jq9O9DQBO3UO', 'student', 'Juan Dela Cruz', NULL, 'JD', '22-10045', 'BSIT-3A')
ON DUPLICATE KEY UPDATE username = username;
