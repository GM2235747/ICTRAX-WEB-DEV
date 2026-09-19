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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    notes TEXT
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
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id)
);

INSERT INTO users (username, password_hash, role, full_name, title, initials, student_id, course)
VALUES
('admin.tech', '$2y$10$9ydj3pKDjwCAuFz.Lqw2gO3/XP/ebfntK4XDdMcaLMVvPt2TQ2mdu', 'admin', 'Ramon Cruz', 'ICT Laboratory Technician', 'RC', NULL, NULL),
('jdelacruz', '$2y$10$3ynLnhoJFVKL.oboJEjKquh9v49F8IpG3HuFRw8J0Jq9O9DQBO3UO', 'student', 'Juan Dela Cruz', NULL, 'JD', '22-10045', 'BSIT-3A')
ON DUPLICATE KEY UPDATE username = username;
