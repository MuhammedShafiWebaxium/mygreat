DROP INDEX IF EXISTS courses_source_id_unique;
ALTER TABLE courses DROP COLUMN IF EXISTS source_id;
