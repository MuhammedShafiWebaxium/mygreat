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
    console.log('Altering country_code column to VARCHAR(255)...')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE required_document_settings 
      ALTER COLUMN country_code TYPE VARCHAR(255);
    `)

    console.log('PostgreSQL column altered successfully!')

  } catch (err) {
    console.error('Alter error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
