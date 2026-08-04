CREATE TABLE IF NOT EXISTS support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'General assistance',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  priority BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_threads_priority_activity_idx ON support_threads(priority DESC,last_message_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('STUDENT','ADMIN','PARTNER')),
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_messages_thread_created_idx ON support_messages(thread_id,created_at);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_minor INTEGER NOT NULL CHECK (price_minor > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_interval TEXT NOT NULL DEFAULT 'MONTH',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_one_active_idx ON subscription_plans(active) WHERE active=TRUE;
INSERT INTO subscription_plans(version,name,price_minor,currency,billing_interval,active)
VALUES(1,'Mygreat Pro',99900,'INR','MONTH',TRUE)
ON CONFLICT(version) DO NOTHING;

CREATE TABLE IF NOT EXISTS student_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  plan_name TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','PAST_DUE','CANCELLED','EXPIRED')),
  started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_subscriptions_student_created_idx ON student_subscriptions(student_id,created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES student_subscriptions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('DUMMY_PROVIDER','MANUAL_RECEIPT')),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCEEDED','REJECTED','REFUNDED')),
  provider_reference TEXT,
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscription_payments_status_created_idx ON subscription_payments(status,created_at DESC);

CREATE TABLE IF NOT EXISTS payment_receipts (
  payment_id UUID PRIMARY KEY REFERENCES subscription_payments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
