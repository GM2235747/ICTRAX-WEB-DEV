-- ICTRAX category-controlled equipment tag IDs
-- Run once on existing databases. New installations already receive these
-- columns and defaults from api/schema.sql.

ALTER TABLE equipment_categories
    ADD COLUMN IF NOT EXISTS tag_id_mode VARCHAR(20) NOT NULL DEFAULT 'automatic' AFTER name,
    ADD COLUMN IF NOT EXISTS tag_prefix VARCHAR(12) NULL AFTER tag_id_mode,
    ADD COLUMN IF NOT EXISTS tag_sequence VARCHAR(6) NULL AFTER tag_prefix;

UPDATE equipment_categories
SET tag_id_mode = 'automatic',
    tag_prefix = CASE name
        WHEN 'Desktop Computer' THEN 'DT'
        WHEN 'Monitor' THEN 'MN'
        WHEN 'Keyboard' THEN 'KB'
        WHEN 'Mouse' THEN 'MO'
        WHEN 'UPS' THEN 'UPS'
        WHEN 'Projector' THEN 'PRJ'
        WHEN 'Printer' THEN 'PRT'
        WHEN 'Router/Switch' THEN 'NET'
        WHEN 'Webcam' THEN 'CAM'
        WHEN 'Headset' THEN 'HS'
    END,
    tag_sequence = COALESCE(NULLIF(tag_sequence, ''), '01')
WHERE name IN ('Desktop Computer', 'Monitor', 'Keyboard', 'Mouse', 'UPS',
               'Projector', 'Printer', 'Router/Switch', 'Webcam', 'Headset')
  AND (tag_prefix IS NULL OR tag_prefix = '' OR tag_sequence IS NULL OR tag_sequence = '');

-- Existing administrator-created categories did not previously have a saved tag
-- policy. Keep them manual until an administrator explicitly chooses a prefix
-- and sequence in Manage Equipment Options.
UPDATE equipment_categories
SET tag_id_mode = 'manual', tag_prefix = NULL, tag_sequence = NULL
WHERE name NOT IN ('Desktop Computer', 'Monitor', 'Keyboard', 'Mouse', 'UPS',
                   'Projector', 'Printer', 'Router/Switch', 'Webcam', 'Headset')
  AND (tag_prefix IS NULL OR tag_prefix = '' OR tag_prefix = 'EQ');
