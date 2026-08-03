ALTER TABLE universities ADD COLUMN website TEXT;

CREATE TABLE university_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (university_id, name)
);
CREATE INDEX university_rankings_university_idx ON university_rankings(university_id);

ALTER TABLE courses
  ADD COLUMN campus TEXT NOT NULL DEFAULT '',
  ADD COLUMN intake_month TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN intake_year TEXT NOT NULL DEFAULT '',
  ADD COLUMN tuition_fee TEXT NOT NULL DEFAULT '',
  ADD COLUMN ranking TEXT NOT NULL DEFAULT '',
  ADD COLUMN ielts TEXT NOT NULL DEFAULT '',
  ADD COLUMN ielts_min TEXT NOT NULL DEFAULT '',
  ADD COLUMN toefl TEXT NOT NULL DEFAULT '',
  ADD COLUMN toefl_min TEXT NOT NULL DEFAULT '',
  ADD COLUMN pte TEXT NOT NULL DEFAULT '',
  ADD COLUMN pte_min TEXT NOT NULL DEFAULT '',
  ADD COLUMN application_deadline TEXT NOT NULL DEFAULT '',
  ADD COLUMN scholarship_available TEXT NOT NULL DEFAULT '',
  ADD COLUMN requirements TEXT NOT NULL DEFAULT '',
  ADD COLUMN backlog_range TEXT NOT NULL DEFAULT '',
  ADD COLUMN remarks TEXT NOT NULL DEFAULT '',
  ADD COLUMN application_mode TEXT NOT NULL DEFAULT '',
  ADD COLUMN english_proficiency TEXT NOT NULL DEFAULT '',
  ADD COLUMN entry_requirements TEXT NOT NULL DEFAULT '';
