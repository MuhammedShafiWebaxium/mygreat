CREATE TABLE "workflow_followup_files" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "followup_id" UUID NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "file_data" BYTEA NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "workflow_followup_files_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_followup_files_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "workflow_followups"("id") ON DELETE CASCADE
);

CREATE INDEX "workflow_followup_files_followup_id_idx" ON "workflow_followup_files"("followup_id");

CREATE TABLE "workflow_approval_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "application_id" UUID NOT NULL,
  "followup_id" UUID NOT NULL,
  "stage" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requested_by_id" UUID NOT NULL,
  "requested_by_name" TEXT NOT NULL,
  "reviewed_by_id" UUID,
  "reviewed_by_name" TEXT,
  "review_note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMPTZ,
  CONSTRAINT "workflow_approval_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_approval_requests_followup_id_key" UNIQUE ("followup_id"),
  CONSTRAINT "workflow_approval_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
  CONSTRAINT "workflow_approval_requests_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "workflow_followups"("id") ON DELETE CASCADE
);

CREATE INDEX "workflow_approval_requests_pending_idx" ON "workflow_approval_requests"("status", "created_at");
