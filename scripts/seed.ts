import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashPassword } from '../src/features/auth/password.server'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
const name = process.env.SEED_SUPER_ADMIN_NAME
const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.SEED_SUPER_ADMIN_PASSWORD

if (!databaseUrl || !name || !email || !password || password.length < 12) {
  throw new Error('Set database and SEED_SUPER_ADMIN_* variables; seed password must contain at least 12 characters.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

try {
  await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'SUPER_ADMIN',
      emailVerifiedAt: new Date(),
    },
    update: {
      name,
      passwordHash: await hashPassword(password),
      role: 'SUPER_ADMIN',
      active: true,
    },
  })
  console.log(`Super Admin ready: ${email}`)
} finally {
  await prisma.$disconnect()
}
