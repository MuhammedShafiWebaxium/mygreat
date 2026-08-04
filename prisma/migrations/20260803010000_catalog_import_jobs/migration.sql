CREATE TABLE IF NOT EXISTS catalog_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  created_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PROCESSING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS catalog_import_jobs_actor_created_idx ON catalog_import_jobs(actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS catalog_import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES catalog_import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  message TEXT NOT NULL,
  row_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_import_errors_job_row_idx ON catalog_import_errors(job_id, row_number);
