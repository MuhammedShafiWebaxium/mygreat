CREATE TYPE "offer_type" AS ENUM ('CONDITIONAL', 'UNCONDITIONAL');
ALTER TABLE "applications" ADD COLUMN "offer_type" "offer_type";

UPDATE "applications"
SET "offer_type" = 'CONDITIONAL'
WHERE "application_stage"::text IN ('CONDITIONAL_OFFER_RECEIVED', 'MOVE_TO_VISA');

UPDATE "applications"
SET "application_stage" = 'APPLICATION_FOLLOW_UP'
WHERE "application_stage"::text = 'CONDITIONAL_OFFER_RECEIVED';
