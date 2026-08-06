ALTER TABLE support_threads DROP CONSTRAINT IF EXISTS support_threads_student_id_key;
ALTER TABLE support_threads DROP CONSTRAINT IF EXISTS support_threads_status_check;
ALTER TABLE support_threads ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS ticket_number BIGSERIAL;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS requester_type TEXT;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS requester_id UUID;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS recipient_type TEXT NOT NULL DEFAULT 'ADMIN';
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS partner_company_id UUID REFERENCES partner_companies(id) ON DELETE SET NULL;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS priority_level TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS assigned_type TEXT;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS assigned_id UUID;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'MESSAGE';
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ;
UPDATE support_threads SET requester_type='STUDENT', requester_id=student_id WHERE requester_type IS NULL;
ALTER TABLE support_threads ALTER COLUMN requester_type SET NOT NULL;
ALTER TABLE support_threads ALTER COLUMN requester_id SET NOT NULL;
ALTER TABLE support_threads ADD CONSTRAINT support_threads_status_check CHECK (status IN ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','POSTPONED','RESOLVED','CLOSED','REOPENED'));
CREATE UNIQUE INDEX IF NOT EXISTS support_threads_ticket_number_key ON support_threads(ticket_number);
CREATE INDEX IF NOT EXISTS support_threads_queue_idx ON support_threads(recipient_type,partner_company_id,status,last_message_at DESC);
CREATE INDEX IF NOT EXISTS support_threads_requester_idx ON support_threads(requester_type,requester_id,last_message_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_events(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL,
  actor_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_ticket_events_thread_idx ON support_ticket_events(thread_id,created_at);
