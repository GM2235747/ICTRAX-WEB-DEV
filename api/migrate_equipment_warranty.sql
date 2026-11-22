-- Add optional warranty tracking to existing ICTRAX equipment records.
-- Safe to run more than once on the supported XAMPP/MariaDB environment.

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS warranty_provider VARCHAR(150) NULL AFTER last_maintenance,
ADD COLUMN IF NOT EXISTS warranty_expiration DATE NULL AFTER warranty_provider;

CREATE INDEX IF NOT EXISTS idx_equipment_warranty_expiration
ON equipment (warranty_expiration);
