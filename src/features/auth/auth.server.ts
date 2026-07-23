import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { z } from 'zod'
import type { loginSchema, registerSchema } from './auth.schema'
import { hashPassword, verifyPassword } from './password.server'
import { createUserSession } from './session.server'

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect

export async function registerStudent(input: z.infer<typeof registerSchema>) {
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw new Error('An account already exists for this email address.')
  }
  const passwordHash = await hashPassword(input.password)

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        passwordHash,
        role: 'STUDENT',
      },
      select: publicUserSelect,
    })

    await Promise.all(input.onboarding.universities.map((university) =>
      tx.university.upsert({
        where: { id: university.id },
        create: university,
        update: university,
      }),
    ))

    await tx.studentProfile.create({
      data: {
        userId: created.id,
        destinationCountry: input.onboarding.country
          ? input.onboarding.country as unknown as Prisma.InputJsonValue
          : Prisma.JsonNull,
        educationLevel: input.onboarding.educationLevel,
        degree: input.onboarding.degree,
        field: input.onboarding.field,
        gpa: input.onboarding.gpa,
        graduationYear: input.onboarding.gradYear,
        englishTest: input.onboarding.englishTest,
        preferredIntake: input.onboarding.intake,
        openToRecommendations: input.onboarding.notSure,
        completedAt: new Date(),
      },
    })

    if (input.onboarding.universities.length) {
      await tx.studentShortlist.createMany({
        data: input.onboarding.universities.map(({ id }) => ({
          userId: created.id,
          universityId: id,
        })),
      })
    }
    return created
  })

  await createUserSession(user.id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

export async function authenticate(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    await hashPassword(input.password)
    throw new Error('Invalid email or password.')
  }
  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid || !user.active) throw new Error('Invalid email or password.')
  await createUserSession(user.id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

export async function updateAccount(userId: string, input: { name: string; email: string; phone?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name, email: input.email, phone: input.phone || null },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
}
