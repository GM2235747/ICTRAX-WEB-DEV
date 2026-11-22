-- Bring databases created by the earlier archive prototype up to the current
-- transactional archive/restore contract. Safe to run more than once.

ALTER TABLE equipment_archive
ADD COLUMN IF NOT EXISTS service_card_json JSON NULL,
ADD COLUMN IF NOT EXISTS equipment_json JSON NULL,
ADD COLUMN IF NOT EXISTS incidents_json JSON NULL,
MODIFY COLUMN archive_reason VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_archive_code
ON equipment_archive (equipment_code);

CREATE INDEX IF NOT EXISTS idx_equipment_archive_date
ON equipment_archive (archived_date);
