CREATE DATABASE IF NOT EXISTS ictrax_db;
USE ictrax_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    google_sub VARCHAR(255) UNIQUE NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('admin','faculty') NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    title VARCHAR(150) NULL,
    initials VARCHAR(10) NULL,
    faculty_id VARCHAR(50) NULL,
    department VARCHAR(150) NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    UNIQUE KEY uq_faculty_id (faculty_id)
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
    warranty_provider VARCHAR(150) NULL,
    warranty_expiration DATE NULL,
    notes TEXT,
    created_by_user_id INT NULL,
    updated_by_user_id INT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_equipment_serial_location (serial_number, location),
    INDEX idx_equipment_status (status),
    INDEX idx_equipment_location (location),
    INDEX idx_equipment_warranty_expiration (warranty_expiration)
);

CREATE TABLE IF NOT EXISTS equipment_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(100) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_equipment_photos_equipment (equipment_id)
);

CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    reported_by_user_id INT NULL,
    reported_by_name VARCHAR(150) NOT NULL,
    reported_by_department VARCHAR(150) NULL,
    date_reported DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    repair_form_json JSON NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    remarks TEXT NULL,
    resolved_date DATE NULL,
    repair_verification_status VARCHAR(30) NOT NULL DEFAULT 'Not Required',
    repair_verification_notes TEXT NULL,
    repair_verified_at TIMESTAMP NULL DEFAULT NULL,
    created_by_user_id INT NULL,
    updated_by_user_id INT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    deleted_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id),
    INDEX idx_incidents_status (status),
    INDEX idx_incidents_repair_verification (repair_verification_status),
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

CREATE TABLE IF NOT EXISTS service_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL UNIQUE,
    office VARCHAR(200) NULL,
    model VARCHAR(150) NULL,
    unit_cost DECIMAL(12,2) NULL,
    service_rows JSON NOT NULL,
    created_by_user_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id),
    INDEX idx_service_cards_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS equipment_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(150) NOT NULL,
    department VARCHAR(150) NULL,
    location VARCHAR(150) NOT NULL,
    archive_reason VARCHAR(255) NOT NULL,
    archived_by INT NULL,
    archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_card_json JSON NULL,
    equipment_json JSON NOT NULL,
    incidents_json JSON NULL,
    INDEX idx_equipment_archive_code (equipment_code),
    INDEX idx_equipment_archive_date (archived_date)
);

CREATE TABLE IF NOT EXISTS equipment_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tag_id_mode VARCHAR(20) NOT NULL DEFAULT 'automatic',
    tag_prefix VARCHAR(12) NULL,
    tag_sequence VARCHAR(6) NULL,
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

INSERT IGNORE INTO equipment_categories (name, tag_id_mode, tag_prefix, tag_sequence, is_builtin) VALUES
('Desktop Computer', 'automatic', 'DT', '01', 1),
('Monitor', 'automatic', 'MN', '01', 1),
('Keyboard', 'automatic', 'KB', '01', 1),
('Mouse', 'automatic', 'MO', '01', 1),
('UPS', 'automatic', 'UPS', '01', 1),
('Projector', 'automatic', 'PRJ', '01', 1),
('Printer', 'automatic', 'PRT', '01', 1),
('Router/Switch', 'automatic', 'NET', '01', 1),
('Webcam', 'automatic', 'CAM', '01', 1),
('Headset', 'automatic', 'HS', '01', 1);

INSERT IGNORE INTO equipment_locations (name, is_builtin) VALUES
('Computer Laboratory 1', 1), ('Computer Laboratory 2', 1),
('Computer Laboratory 3', 1), ('Server Room', 1);

INSERT INTO users (username, email, password_hash, role, full_name, title, initials, faculty_id, department)
VALUES
('admin.tech', 'ictstest2026@mls.ceu.edu.ph', NULL, 'admin', 'ICTRAX Administrator', 'ICT Laboratory Administrator', 'IA', NULL, NULL)
ON DUPLICATE KEY UPDATE username = username;
