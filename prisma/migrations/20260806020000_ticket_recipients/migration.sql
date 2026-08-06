ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS recipient_id UUID;

CREATE INDEX IF NOT EXISTS support_threads_recipient_idx
  ON support_threads(recipient_type, recipient_id, status, last_message_at DESC);
