ALTER TABLE "students"
ADD COLUMN "assigned_partner_company_id" UUID;

ALTER TABLE "students"
ADD CONSTRAINT "students_assigned_partner_company_id_fkey"
FOREIGN KEY ("assigned_partner_company_id") REFERENCES "partner_companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "students_partner_company_idx"
ON "students"("assigned_partner_company_id");
