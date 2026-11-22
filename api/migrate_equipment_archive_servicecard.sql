
-- ICTRAX Equipment Archive and Service Card Enhancement

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS department VARCHAR(150) NULL,
ADD COLUMN IF NOT EXISTS service_card_number VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS archive_status VARCHAR(30) DEFAULT 'active';

CREATE TABLE IF NOT EXISTS equipment_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id VARCHAR(100),
    equipment_code VARCHAR(100),
    equipment_name VARCHAR(150),
    department VARCHAR(150),
    location VARCHAR(150),
    archive_reason VARCHAR(100),
    archived_by VARCHAR(150),
    archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_card_json JSON NULL,
    equipment_json JSON NULL,
    incidents_json JSON NULL
);

ALTER TABLE equipment_archive
ADD COLUMN IF NOT EXISTS service_card_json JSON NULL,
ADD COLUMN IF NOT EXISTS equipment_json JSON NULL,
ADD COLUMN IF NOT EXISTS incidents_json JSON NULL,
MODIFY COLUMN archive_reason VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_archive_code
ON equipment_archive (equipment_code);

CREATE INDEX IF NOT EXISTS idx_equipment_archive_date
ON equipment_archive (archived_date);

CREATE TABLE IF NOT EXISTS service_card_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id VARCHAR(100),
    old_service_card_number VARCHAR(50),
    new_service_card_number VARCHAR(50),
    reason VARCHAR(100),
    changed_by VARCHAR(150),
    changed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
