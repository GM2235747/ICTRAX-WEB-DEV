-- ICTRAX Faculty Role Migration
-- Use this once on an existing ictrax_db that was created from the Student-role version.

USE ictrax_db;

-- Temporarily allow both roles so existing student rows can be converted safely.
ALTER TABLE users MODIFY role ENUM('admin','student','faculty') NOT NULL;
UPDATE users SET role='faculty' WHERE role='student';
ALTER TABLE users MODIFY role ENUM('admin','faculty') NOT NULL;

-- Rename student-specific profile columns to faculty terminology.
ALTER TABLE users CHANGE COLUMN student_id faculty_id VARCHAR(50) NULL;
ALTER TABLE users CHANGE COLUMN course department VARCHAR(150) NULL;

-- Keep a clear unique constraint for faculty IDs.
ALTER TABLE users DROP INDEX uq_student_id;
ALTER TABLE users ADD UNIQUE KEY uq_faculty_id (faculty_id);

-- Rename incident reporter affiliation column.
ALTER TABLE incidents CHANGE COLUMN reported_by_course reported_by_department VARCHAR(150) NULL;

-- Convert the old demo record to a faculty demo account if it exists.
UPDATE users
SET username='faculty.ce',
    password_hash='$2y$12$rozVOeEoIQZacVn0bmORi.RGdEgU3/AU0tg6SQcAFX7YYW1SY84Eu',
    full_name='Maria Santos',
    title='Faculty Member',
    initials='MS',
    faculty_id='FAC-001',
    department='College of Information Technology',
    role='faculty'
WHERE username='jdelacruz';

