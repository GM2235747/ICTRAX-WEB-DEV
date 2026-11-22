-- Run this once on an existing ICTRAX database that already has Google login.
-- It makes ictstest2026@mls.ceu.edu.ph the sole active administrator account.
USE ictrax_db;

START TRANSACTION;

-- Reuse the original prototype administrator record when the new address is
-- not already attached to another user. Reset its Google subject because the
-- email identity changed.
UPDATE users
SET email = 'ictstest2026@mls.ceu.edu.ph',
    google_sub = NULL,
    active = 1,
    deleted_at = NULL,
    deleted_by_user_id = NULL
WHERE username = 'admin.tech'
  AND role = 'admin'
  AND NOT EXISTS (
      SELECT 1
      FROM (SELECT email FROM users) AS existing_users
      WHERE LOWER(existing_users.email) = 'ictstest2026@mls.ceu.edu.ph'
  );

-- Create the policy administrator if neither the old prototype row nor an
-- existing row supplied it.
INSERT INTO users
    (username, email, google_sub, password_hash, role, full_name, title, initials, faculty_id, department, active)
SELECT
    'admin.ictstest2026',
    'ictstest2026@mls.ceu.edu.ph',
    NULL,
    NULL,
    'admin',
    'ICTRAX Administrator',
    'ICT Laboratory Administrator',
    'IA',
    NULL,
    NULL,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE LOWER(email) = 'ictstest2026@mls.ceu.edu.ph'
);

-- If the authorized email already existed under another role, assign it to
-- the administrator role and keep it active.
UPDATE users
SET role = 'admin',
    active = 1,
    deleted_at = NULL,
    deleted_by_user_id = NULL
WHERE LOWER(email) = 'ictstest2026@mls.ceu.edu.ph';

-- Other administrator records are retained for audit/history but cannot be
-- used as active administrator accounts.
UPDATE users
SET active = 0
WHERE role = 'admin'
  AND (email IS NULL OR LOWER(email) <> 'ictstest2026@mls.ceu.edu.ph');

-- Retain legacy faculty rows for history, but revoke accounts that no longer
-- meet the verified CEU Google-domain policy.
UPDATE users
SET active = 0
WHERE role = 'faculty'
  AND (
      email IS NULL
      OR (
          LOWER(email) NOT LIKE '%@mls.ceu.edu.ph'
          AND LOWER(email) NOT LIKE '%@ceu.edu.ph'
      )
  );

COMMIT;

-- Faculty accounts need no seed rows. A verified @mls.ceu.edu.ph or @ceu.edu.ph
-- Google account receives a profile on its first successful sign-in.
