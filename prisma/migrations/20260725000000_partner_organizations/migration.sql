ALTER TYPE "public"."partner_role" ADD VALUE 'ORGANIZATION_ADMIN' BEFORE 'ADMISSIONS_EXECUTIVE';
CREATE TYPE "public"."organization_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "partner_organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "registration_number" text NOT NULL,
  "website" text,
  "address" text NOT NULL,
  "country" text NOT NULL,
  "contact_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "contact_phone" text NOT NULL,
  "status" "public"."organization_status" NOT NULL DEFAULT 'PENDING',
  "review_note" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "credentials_sent_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "partner_organizations" (
  "id", "name", "registration_number", "address", "country",
  "contact_name", "contact_email", "contact_phone", "status"
)
SELECT
  gen_random_uuid(), 'Legacy Mygreat Partners', 'LEGACY-' || gen_random_uuid()::text,
  'Imported account', 'Unknown', 'Legacy administrator',
  'legacy-partners-' || gen_random_uuid()::text || '@invalid.local', '',
  'APPROVED'::"public"."organization_status"
WHERE EXISTS (SELECT 1 FROM "partners");

ALTER TABLE "partners" ADD COLUMN "organization_id" uuid;
ALTER TABLE "partners" ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false;
UPDATE "partners"
SET "organization_id" = (SELECT "id" FROM "partner_organizations" WHERE "name" = 'Legacy Mygreat Partners' LIMIT 1);
ALTER TABLE "partners" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_partner_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "partner_organizations"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "partner_organizations_registration_unique" ON "partner_organizations"("registration_number");
CREATE UNIQUE INDEX "partner_organizations_contact_email_unique" ON "partner_organizations"("contact_email");
CREATE INDEX "partner_organizations_status_idx" ON "partner_organizations"("status", "created_at");
CREATE INDEX "partners_organization_idx" ON "partners"("organization_id");
