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
    console.log('Adding program_level column to required_document_settings PostgreSQL table...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE required_document_settings
      ADD COLUMN IF NOT EXISTS program_level VARCHAR(50) DEFAULT 'ALL';
    `)

    console.log('Successfully added program_level column!')
  } catch (err) {
    console.error('Error adding program_level column:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
