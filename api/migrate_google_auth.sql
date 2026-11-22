-- Safely repeatable migration for an ICTRAX database created before Google login.
-- Existing columns and equivalent single-column unique indexes are left intact.
USE ictrax_db;

SET @ictrax_migration_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'email'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL AFTER username'
);
PREPARE ictrax_migration_statement FROM @ictrax_migration_sql;
EXECUTE ictrax_migration_statement;
DEALLOCATE PREPARE ictrax_migration_statement;

SET @ictrax_migration_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'google_sub'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) NULL AFTER email'
);
PREPARE ictrax_migration_statement FROM @ictrax_migration_sql;
EXECUTE ictrax_migration_statement;
DEALLOCATE PREPARE ictrax_migration_statement;

-- Do not overwrite another account if the administrator email is already in use.
UPDATE users AS target
LEFT JOIN users AS assigned
  ON LOWER(assigned.email) = 'ictstest2026@mls.ceu.edu.ph'
 AND assigned.id <> target.id
SET target.email = 'ictstest2026@mls.ceu.edu.ph'
WHERE target.username = 'admin.tech'
  AND assigned.id IS NULL;

ALTER TABLE users MODIFY email VARCHAR(254) NULL;
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;

SET @ictrax_migration_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS AS existing_index
        WHERE existing_index.TABLE_SCHEMA = DATABASE()
          AND existing_index.TABLE_NAME = 'users'
          AND existing_index.COLUMN_NAME = 'email'
          AND existing_index.NON_UNIQUE = 0
          AND (
              SELECT COUNT(*)
              FROM information_schema.STATISTICS AS index_columns
              WHERE index_columns.TABLE_SCHEMA = existing_index.TABLE_SCHEMA
                AND index_columns.TABLE_NAME = existing_index.TABLE_NAME
                AND index_columns.INDEX_NAME = existing_index.INDEX_NAME
          ) = 1
    ),
    'SELECT 1',
    'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)'
);
PREPARE ictrax_migration_statement FROM @ictrax_migration_sql;
EXECUTE ictrax_migration_statement;
DEALLOCATE PREPARE ictrax_migration_statement;

SET @ictrax_migration_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS AS existing_index
        WHERE existing_index.TABLE_SCHEMA = DATABASE()
          AND existing_index.TABLE_NAME = 'users'
          AND existing_index.COLUMN_NAME = 'google_sub'
          AND existing_index.NON_UNIQUE = 0
          AND (
              SELECT COUNT(*)
              FROM information_schema.STATISTICS AS index_columns
              WHERE index_columns.TABLE_SCHEMA = existing_index.TABLE_SCHEMA
                AND index_columns.TABLE_NAME = existing_index.TABLE_NAME
                AND index_columns.INDEX_NAME = existing_index.INDEX_NAME
          ) = 1
    ),
    'SELECT 1',
    'ALTER TABLE users ADD UNIQUE KEY uq_users_google_sub (google_sub)'
);
PREPARE ictrax_migration_statement FROM @ictrax_migration_sql;
EXECUTE ictrax_migration_statement;
DEALLOCATE PREPARE ictrax_migration_statement;

SET @ictrax_migration_sql = NULL;

-- Google-only prototype accounts do not need local password hashes.
UPDATE users SET password_hash = NULL WHERE username IN ('admin.tech','faculty.ce');

-- Faculty profiles are created automatically on first sign-in for verified
-- Google accounts ending in @mls.ceu.edu.ph or @ceu.edu.ph.
