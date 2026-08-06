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
    console.log('Migrating database schema to remove APPLICATION category...')

    // 1. Convert any residual APPLICATION category rows to PERSONAL or VISA_COUNTRY
    await prisma.$executeRawUnsafe(`
      UPDATE required_document_settings 
      SET category = 'PERSONAL'::document_category 
      WHERE category = 'APPLICATION'::document_category;
    `)

    // 2. Recreate enum type without APPLICATION
    await prisma.$executeRawUnsafe(`
      ALTER TYPE document_category RENAME TO document_category_old;
      CREATE TYPE document_category AS ENUM ('PERSONAL', 'ACADEMIC', 'FINANCIAL', 'VISA_COUNTRY');
      ALTER TABLE required_document_settings ALTER COLUMN category DROP DEFAULT;
      ALTER TABLE required_document_settings ALTER COLUMN category TYPE document_category USING category::text::document_category;
      ALTER TABLE required_document_settings ALTER COLUMN category SET DEFAULT 'PERSONAL'::document_category;
      DROP TYPE document_category_old;
    `)

    console.log('Database enum migration completed successfully!')

  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
