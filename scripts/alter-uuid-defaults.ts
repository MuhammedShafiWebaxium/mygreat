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
    console.log('Adding gen_random_uuid() default to workflow UUID tables in PostgreSQL...')

    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      ALTER TABLE workflow_followups ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE workflow_followup_files ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE workflow_approval_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE visa_attempts ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE application_offer_letters ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `)

    console.log('Successfully set gen_random_uuid() defaults for all workflow tables!')
  } catch (err) {
    console.error('Error setting UUID defaults:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
