ALTER TABLE support_threads DROP CONSTRAINT IF EXISTS support_threads_status_check;
UPDATE support_threads SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, closed_at, NOW()) WHERE status = 'CLOSED';
ALTER TABLE support_threads
  ADD CONSTRAINT support_threads_status_check
  CHECK (status IN ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','POSTPONED','RESOLUTION_PENDING','RESOLVED','REOPENED'));

ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS resolution_requested_at TIMESTAMPTZ;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS resolution_decided_at TIMESTAMPTZ;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS resolution_decision TEXT;

CREATE INDEX IF NOT EXISTS support_threads_resolution_due_idx
  ON support_threads(resolution_due_at)
  WHERE status = 'RESOLUTION_PENDING';
