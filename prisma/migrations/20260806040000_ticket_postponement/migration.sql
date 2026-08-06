ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS postponed_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS support_threads_postponed_until_idx
  ON support_threads(postponed_until)
  WHERE status = 'POSTPONED';
