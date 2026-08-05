CREATE TABLE IF NOT EXISTS "required_document_settings" (
  "id" VARCHAR(80) PRIMARY KEY,
  "name" VARCHAR(160) NOT NULL,
  "accept" VARCHAR(255) NOT NULL DEFAULT '.pdf,.jpg,.jpeg,.png',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "required_document_settings" ("id", "name", "accept", "sort_order") VALUES
  ('passport', 'Passport', '.pdf,.jpg,.jpeg,.png', 10),
  ('passport-photo', 'Passport-size photograph', '.jpg,.jpeg,.png', 20),
  ('cv', 'CV or résumé', '.pdf,.doc,.docx', 30),
  ('aadhaar', 'Aadhaar', '.pdf,.jpg,.jpeg,.png', 40),
  ('10th-certificate', '10th certificate / mark sheet', '.pdf,.jpg,.jpeg,.png', 50),
  ('12th-certificate', '12th certificate / mark sheet', '.pdf,.jpg,.jpeg,.png', 60)
ON CONFLICT ("id") DO NOTHING;
