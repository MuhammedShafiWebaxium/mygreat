-- Preserve the former summary enum names when this is the first run. These
-- guards also allow recovery when an earlier attempt completed only the enum
-- renames before failing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_lifecycle_status') THEN
    ALTER TYPE "application_status" RENAME TO "application_lifecycle_status";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visa_status')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visa_lifecycle_status') THEN
    ALTER TYPE "visa_status" RENAME TO "visa_lifecycle_status";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE "application_status" AS ENUM (
      'SOP_PREPARATION', 'SOP_VERIFICATION', 'SOP_CORRECTION_REQUIRED',
      'SOP_APPROVED', 'APPLICATION_SUBMISSION', 'APPLICATION_ACCEPTED',
      'APPLICATION_FOLLOW_UP', 'CONDITIONAL_OFFER_RECEIVED', 'MOVE_TO_VISA'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visa_status') THEN
    CREATE TYPE "visa_status" AS ENUM (
      'MEET_OFFER_CONDITIONS', 'TUITION_FEE_PAYMENT',
      'VISA_DOCUMENT_COLLECTION', 'VISA_SERVICE_CHARGE', 'VISA_SLOT_BOOKING',
      'VISA_LEVEL_1_VERIFICATION', 'VISA_LEVEL_2_VERIFICATION',
      'VISA_SUBMISSION', 'VISA_APPROVED', 'VISA_REJECTED',
      'VISA_REAPPLY_OR_APPEAL', 'VISA_GRANTED'
    );
  END IF;
END $$;

-- The former resubmission exception is represented as returning to submission.
UPDATE "applications"
SET "application_stage" = 'APPLICATION_SUBMISSION'
WHERE "application_stage" = 'APPLICATION_RESUBMISSION_REQUIRED';

ALTER TABLE "applications"
  ALTER COLUMN "application_stage" DROP DEFAULT,
  ALTER COLUMN "application_stage" TYPE "application_status"
    USING "application_stage"::"application_status",
  ALTER COLUMN "application_stage" SET DEFAULT 'SOP_PREPARATION'::"application_status";

ALTER TABLE "visa_attempts"
  ALTER COLUMN "current_stage" DROP DEFAULT,
  ALTER COLUMN "current_stage" TYPE "visa_status"
    USING "current_stage"::"visa_status",
  ALTER COLUMN "current_stage" SET DEFAULT 'MEET_OFFER_CONDITIONS'::"visa_status";
