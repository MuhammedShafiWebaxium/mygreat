import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

async function main() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })

  try {
    console.log('Applying migration for required_document_settings...')

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
          CREATE TYPE document_category AS ENUM ('PERSONAL', 'ACADEMIC', 'APPLICATION', 'FINANCIAL', 'VISA_COUNTRY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_stage') THEN
          CREATE TYPE document_stage AS ENUM ('PROFILE_ONBOARDING', 'APPLICATION_SUBMISSION', 'VISA_PROCESSING');
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      ALTER TABLE required_document_settings 
        ADD COLUMN IF NOT EXISTS category document_category NOT NULL DEFAULT 'PERSONAL',
        ADD COLUMN IF NOT EXISTS stage document_stage NOT NULL DEFAULT 'PROFILE_ONBOARDING',
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
        ADD COLUMN IF NOT EXISTS financial_type VARCHAR(30);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS required_document_settings_cat_stage_country_idx 
        ON required_document_settings (category, stage, country_code);
    `)

    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
