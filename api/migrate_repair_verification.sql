-- Add submitter verification to the ICTRAX repair-completion workflow.
-- Safe to run more than once on the supported XAMPP/MariaDB environment.

ALTER TABLE incidents
    ADD COLUMN IF NOT EXISTS repair_verification_status VARCHAR(30) NOT NULL DEFAULT 'Not Required' AFTER resolved_date,
    ADD COLUMN IF NOT EXISTS repair_verification_notes TEXT NULL AFTER repair_verification_status,
    ADD COLUMN IF NOT EXISTS repair_verified_at TIMESTAMP NULL DEFAULT NULL AFTER repair_verification_notes;

CREATE INDEX IF NOT EXISTS idx_incidents_repair_verification
ON incidents (repair_verification_status);

-- Existing resolved reports submitted through an authenticated faculty or
-- non-teaching account receive the same verification opportunity as new ones.
UPDATE incidents
SET repair_verification_status = 'Awaiting Verification',
    repair_verification_notes = NULL,
    repair_verified_at = NULL
WHERE status = 'Resolved'
  AND reported_by_user_id IS NOT NULL
  AND repair_verification_status = 'Not Required'
  AND deleted_at IS NULL;
