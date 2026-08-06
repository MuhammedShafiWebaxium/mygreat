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
    console.log('Testing upsert directly...')
    const res = await prisma.requiredDocumentSetting.upsert({
      where: { id: 'uk-cas-letter' },
      create: {
        id: 'uk-cas-letter',
        name: 'CAS Letter',
        accept: '.pdf',
        active: true,
        sortOrder: 100,
        category: 'VISA_COUNTRY',
        stage: 'VISA_PROCESSING',
        countryCode: 'GBR',
        financialType: null,
      },
      update: {
        name: 'CAS Letter',
        accept: '.pdf',
        active: true,
        sortOrder: 100,
        category: 'VISA_COUNTRY',
        stage: 'VISA_PROCESSING',
        countryCode: 'GBR',
        financialType: null,
      },
    })
    console.log('Success:', res)
  } catch (err) {
    console.error('Direct upsert error details:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
