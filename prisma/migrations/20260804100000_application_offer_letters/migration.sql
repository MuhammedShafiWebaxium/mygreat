CREATE TABLE "application_offer_letters" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "application_id" UUID NOT NULL,
  "offer_type" "offer_type" NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "file_data" BYTEA NOT NULL,
  "uploaded_by_id" UUID NOT NULL,
  "uploaded_by_name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "application_offer_letters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "application_offer_letters_application_id_key" UNIQUE ("application_id"),
  CONSTRAINT "application_offer_letters_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE
);
