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
    console.log('Testing SQL seeding...')
    const templates = [
      { id: 'uk-cas-letter', name: 'CAS Letter', accept: '.pdf', active: true, sortOrder: 100, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', financialType: null },
      { id: 'us-form-i20', name: 'Form I-20 (Issued by Institution)', accept: '.pdf', active: true, sortOrder: 200, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', financialType: null },
    ]

    for (const item of templates) {
      await prisma.$executeRaw`
        INSERT INTO required_document_settings (
          id, name, accept, active, sort_order, category, stage, country_code, financial_type, created_at, updated_at
        ) VALUES (
          ${item.id}, ${item.name}, ${item.accept}, ${item.active}, ${item.sortOrder},
          ${item.category}::document_category, ${item.stage}::document_stage, ${item.countryCode}, ${item.financialType}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          accept = EXCLUDED.accept,
          active = EXCLUDED.active,
          sort_order = EXCLUDED.sort_order,
          category = EXCLUDED.category,
          stage = EXCLUDED.stage,
          country_code = EXCLUDED.country_code,
          financial_type = EXCLUDED.financial_type,
          updated_at = NOW()
      `
    }

    const total = await prisma.requiredDocumentSetting.count()
    console.log('SQL Seeding succeeded! Total records in table:', total)

  } catch (err) {
    console.error('Error during SQL seeding:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
