ALTER TABLE "workflow_approval_requests"
  ADD COLUMN "workflow_type" TEXT NOT NULL DEFAULT 'APPLICATION',
  ADD COLUMN "visa_attempt_id" UUID;

ALTER TABLE "workflow_approval_requests"
  ADD CONSTRAINT "workflow_approval_requests_visa_attempt_id_fkey"
  FOREIGN KEY ("visa_attempt_id") REFERENCES "visa_attempts"("id") ON DELETE CASCADE;

CREATE INDEX "workflow_approval_requests_visa_attempt_id_idx"
  ON "workflow_approval_requests"("visa_attempt_id");
