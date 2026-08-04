ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS application_stage TEXT NOT NULL DEFAULT 'SOP_PREPARATION';

CREATE UNIQUE INDEX IF NOT EXISTS applications_one_priority_per_student_idx
  ON applications(student_id) WHERE is_priority;

-- A single existing application is unambiguous. Students with multiple existing
-- applications intentionally remain without a priority for staff resolution.
UPDATE applications a SET is_priority = TRUE
WHERE (SELECT COUNT(*) FROM applications x WHERE x.student_id = a.student_id) = 1;

CREATE TABLE IF NOT EXISTS visa_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  current_stage TEXT NOT NULL DEFAULT 'MEET_OFFER_CONDITIONS',
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, attempt_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS visa_attempts_one_current_idx
  ON visa_attempts(application_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS visa_attempts_application_idx ON visa_attempts(application_id, created_at DESC);

-- Existing non-empty visa activity is already tied to a specific application,
-- so one current attempt can be backfilled safely for those records.
INSERT INTO visa_attempts(application_id, attempt_number, is_current, current_stage, outcome)
SELECT id, 1, TRUE,
  CASE visa_status::text
    WHEN 'DOCUMENTS_PENDING' THEN 'VISA_DOCUMENT_COLLECTION'
    WHEN 'READY_TO_FILE' THEN 'VISA_SLOT_BOOKING'
    WHEN 'FILED' THEN 'VISA_DECISION'
    WHEN 'APPROVED' THEN 'VISA_GRANTED'
    WHEN 'REJECTED' THEN 'VISA_REAPPLY_OR_APPEAL'
    ELSE 'MEET_OFFER_CONDITIONS'
  END,
  CASE WHEN visa_status::text IN ('APPROVED','REJECTED') THEN visa_status::text END
FROM applications WHERE visa_status::text <> 'NOT_STARTED'
ON CONFLICT(application_id, attempt_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS workflow_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  visa_attempt_id UUID REFERENCES visa_attempts(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('APPLICATION', 'VISA')),
  stage TEXT NOT NULL,
  outcome TEXT,
  notes TEXT NOT NULL DEFAULT '',
  expected_completion_at TIMESTAMPTZ,
  expected_completion_end_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  assigned_staff_id UUID,
  assigned_staff_name TEXT,
  created_by_id UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  followed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((workflow_type = 'APPLICATION' AND visa_attempt_id IS NULL) OR (workflow_type = 'VISA' AND visa_attempt_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS workflow_followups_application_idx
  ON workflow_followups(application_id, workflow_type, followed_up_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS workflow_followups_visa_idx
  ON workflow_followups(visa_attempt_id, followed_up_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS workflow_followups_student_idx
  ON workflow_followups(student_id, followed_up_at DESC);
