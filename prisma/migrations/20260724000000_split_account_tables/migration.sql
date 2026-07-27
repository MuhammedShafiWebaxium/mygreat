CREATE TYPE "public"."partner_role" AS ENUM ('ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'RECEPTION_EXECUTIVE');
CREATE TYPE "public"."admin_role" AS ENUM ('SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE');

CREATE TABLE "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "password_hash" text NOT NULL,
  "role" "public"."admin_role" NOT NULL,
  "email_verified_at" timestamptz,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "password_hash" text NOT NULL,
  "role" "public"."partner_role" NOT NULL,
  "email_verified_at" timestamptz,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "admins" ("id", "name", "email", "phone", "password_hash", "role", "email_verified_at", "active", "created_at", "updated_at")
SELECT "id", "name", "email", "phone", "password_hash", 'SUPER_ADMIN'::"public"."admin_role", "email_verified_at", "active", "created_at", "updated_at"
FROM "users" WHERE "role" = 'SUPER_ADMIN';

INSERT INTO "partners" ("id", "name", "email", "phone", "password_hash", "role", "email_verified_at", "active", "created_at", "updated_at")
SELECT "id", "name", "email", "phone", "password_hash", "role"::text::"public"."partner_role", "email_verified_at", "active", "created_at", "updated_at"
FROM "users" WHERE "role" IN ('ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE');

CREATE TABLE "admin_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "admin_id" uuid NOT NULL REFERENCES "admins"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "partner_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "student_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "admin_sessions" SELECT s."id", s."user_id", s."token_hash", s."expires_at", s."last_seen_at", s."created_at"
FROM "sessions" s JOIN "users" u ON u."id" = s."user_id" WHERE u."role" = 'SUPER_ADMIN';
INSERT INTO "partner_sessions" SELECT s."id", s."user_id", s."token_hash", s."expires_at", s."last_seen_at", s."created_at"
FROM "sessions" s JOIN "users" u ON u."id" = s."user_id" WHERE u."role" IN ('ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE');
INSERT INTO "student_sessions" SELECT s."id", s."user_id", s."token_hash", s."expires_at", s."last_seen_at", s."created_at"
FROM "sessions" s JOIN "users" u ON u."id" = s."user_id" WHERE u."role" = 'STUDENT';

ALTER TABLE "applications" DROP CONSTRAINT "applications_admissions_executive_id_users_id_fk";
ALTER TABLE "applications" DROP CONSTRAINT "applications_visa_executive_id_users_id_fk";
ALTER TABLE "documents" DROP CONSTRAINT "documents_verified_by_users_id_fk";
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_id_users_id_fk";
DROP TABLE "sessions";

DELETE FROM "users" WHERE "role" <> 'STUDENT';
ALTER TABLE "users" DROP COLUMN "role";
ALTER TABLE "users" RENAME TO "students";
ALTER INDEX "users_email_unique" RENAME TO "students_email_unique";
DROP INDEX IF EXISTS "users_role_idx";

ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_admissions_executive_id_partners_id_fk"
  FOREIGN KEY ("admissions_executive_id") REFERENCES "partners"("id") ON DELETE SET NULL;
ALTER TABLE "applications" ADD CONSTRAINT "applications_visa_executive_id_partners_id_fk"
  FOREIGN KEY ("visa_executive_id") REFERENCES "partners"("id") ON DELETE SET NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_partners_id_fk"
  FOREIGN KEY ("verified_by") REFERENCES "partners"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX "admins_email_unique" ON "admins"("email");
CREATE INDEX "admins_role_idx" ON "admins"("role");
CREATE UNIQUE INDEX "partners_email_unique" ON "partners"("email");
CREATE INDEX "partners_role_idx" ON "partners"("role");
CREATE UNIQUE INDEX "admin_sessions_token_hash_unique" ON "admin_sessions"("token_hash");
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions"("admin_id");
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions"("expires_at");
CREATE UNIQUE INDEX "partner_sessions_token_hash_unique" ON "partner_sessions"("token_hash");
CREATE INDEX "partner_sessions_partner_idx" ON "partner_sessions"("partner_id");
CREATE INDEX "partner_sessions_expiry_idx" ON "partner_sessions"("expires_at");
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "student_sessions"("token_hash");
CREATE INDEX "student_sessions_student_idx" ON "student_sessions"("student_id");
CREATE INDEX "student_sessions_expiry_idx" ON "student_sessions"("expires_at");

DROP TYPE "public"."user_role";
