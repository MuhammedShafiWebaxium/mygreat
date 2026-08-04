UPDATE "visa_attempts"
SET "current_stage" = 'VISA_REAPPLY_OR_APPEAL'
WHERE "current_stage"::text = 'VISA_REJECTED';

UPDATE "workflow_followups"
SET "stage" = 'VISA_REAPPLY_OR_APPEAL'
WHERE "workflow_type" = 'VISA' AND "stage" = 'VISA_REJECTED';

ALTER TABLE "visa_attempts" ALTER COLUMN "current_stage" DROP DEFAULT;
ALTER TYPE "visa_status" RENAME TO "visa_status_with_rejected";

CREATE TYPE "visa_status" AS ENUM (
  'MEET_OFFER_CONDITIONS',
  'TUITION_FEE_PAYMENT',
  'VISA_DOCUMENT_COLLECTION',
  'VISA_SERVICE_CHARGE',
  'VISA_SLOT_BOOKING',
  'VISA_LEVEL_1_VERIFICATION',
  'VISA_LEVEL_2_VERIFICATION',
  'VISA_SUBMISSION',
  'VISA_APPROVED',
  'VISA_REAPPLY_OR_APPEAL',
  'VISA_GRANTED'
);

ALTER TABLE "visa_attempts"
  ALTER COLUMN "current_stage" TYPE "visa_status"
  USING "current_stage"::text::"visa_status",
  ALTER COLUMN "current_stage" SET DEFAULT 'MEET_OFFER_CONDITIONS'::"visa_status";

DROP TYPE "visa_status_with_rejected";
