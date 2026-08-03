CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE,
  code VARCHAR(3) NOT NULL UNIQUE, currency_code VARCHAR(3) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preserve legacy universities by creating a country for every existing country key.
INSERT INTO countries (id, name, code, currency_code)
SELECT CASE WHEN country_id ~* '^[0-9a-f-]{36}$' THEN country_id::uuid ELSE gen_random_uuid() END,
       CASE LOWER(country_id) WHEN 'us' THEN 'United States' WHEN 'uk' THEN 'United Kingdom' WHEN 'ca' THEN 'Canada' WHEN 'au' THEN 'Australia' WHEN 'de' THEN 'Germany' WHEN 'ie' THEN 'Ireland' WHEN 'nz' THEN 'New Zealand' WHEN 'nl' THEN 'Netherlands' WHEN 'fr' THEN 'France' WHEN 'sg' THEN 'Singapore' ELSE country_id END,
       CASE WHEN LENGTH(country_id) BETWEEN 2 AND 3 THEN UPPER(country_id) ELSE UPPER(SUBSTRING(md5(country_id), 1, 3)) END,
       CASE LOWER(country_id) WHEN 'uk' THEN 'GBP' WHEN 'ca' THEN 'CAD' WHEN 'au' THEN 'AUD' WHEN 'de' THEN 'EUR' WHEN 'ie' THEN 'EUR' WHEN 'nl' THEN 'EUR' WHEN 'fr' THEN 'EUR' WHEN 'nz' THEN 'NZD' WHEN 'sg' THEN 'SGD' ELSE 'USD' END
FROM universities GROUP BY country_id
ON CONFLICT DO NOTHING;

ALTER TABLE universities ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE universities ADD COLUMN country_id_new UUID;
UPDATE universities u SET country_id_new = c.id FROM countries c
WHERE c.code = UPPER(u.country_id) OR c.name = u.country_id;
ALTER TABLE universities ALTER COLUMN country_id_new SET NOT NULL;
DROP INDEX IF EXISTS universities_country_idx;
ALTER TABLE universities DROP COLUMN country_id;
ALTER TABLE universities RENAME COLUMN country_id_new TO country_id;
CREATE INDEX universities_country_idx ON universities(country_id);
ALTER TABLE universities ALTER COLUMN rank SET DEFAULT 0;
ALTER TABLE universities ADD CONSTRAINT universities_country_fk FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT;

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT NOT NULL, level TEXT NOT NULL, duration_months INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (university_id, code)
);
CREATE INDEX courses_university_idx ON courses(university_id);

CREATE TABLE course_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0), currency_code VARCHAR(3) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL, effective_to TIMESTAMPTZ, created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX course_fees_course_effective_idx ON course_fees(course_id, effective_from);

ALTER TABLE applications ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN quoted_fee_amount DECIMAL(12,2);
ALTER TABLE applications ADD COLUMN quoted_fee_currency VARCHAR(3);
ALTER TABLE applications ADD COLUMN fee_quoted_at TIMESTAMPTZ;
