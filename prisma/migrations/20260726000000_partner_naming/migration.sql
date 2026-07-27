DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'partner_role' AND e.enumlabel = 'ORGANIZATION_ADMIN')
     AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                     WHERE t.typname = 'partner_role' AND e.enumlabel = 'PARTNER_ADMIN') THEN
    ALTER TYPE "public"."partner_role" RENAME VALUE 'ORGANIZATION_ADMIN' TO 'PARTNER_ADMIN';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_status')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_status') THEN
    ALTER TYPE "public"."organization_status" RENAME TO "partner_status";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.partner_organizations') IS NOT NULL
     AND to_regclass('public.partner_companies') IS NULL THEN
    ALTER TABLE "partner_organizations" RENAME TO "partner_companies";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'partners' AND column_name = 'organization_id') THEN
    ALTER TABLE "partners" RENAME COLUMN "organization_id" TO "partner_company_id";
  END IF;
END $$;

ALTER INDEX IF EXISTS "partner_organizations_registration_unique" RENAME TO "partner_companies_registration_unique";
ALTER INDEX IF EXISTS "partner_organizations_contact_email_unique" RENAME TO "partner_companies_contact_email_unique";
ALTER INDEX IF EXISTS "partner_organizations_status_idx" RENAME TO "partner_companies_status_idx";
ALTER INDEX IF EXISTS "partners_organization_idx" RENAME TO "partners_company_idx";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE table_name = 'partners'
               AND constraint_name = 'partners_organization_id_partner_organizations_id_fk') THEN
    ALTER TABLE "partners"
      RENAME CONSTRAINT "partners_organization_id_partner_organizations_id_fk"
      TO "partners_company_id_partner_companies_id_fk";
  END IF;
END $$;
