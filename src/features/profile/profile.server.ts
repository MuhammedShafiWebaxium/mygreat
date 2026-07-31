import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { Country } from '@/types'
import type { OnboardingInput } from './profile.schema'

export async function readStudentProfile(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return null
  const shortlist = await prisma.studentShortlist.findMany({
    where: { userId },
    select: {
      university: {
        select: {
          id: true,
          name: true,
          city: true,
          countryId: true,
          rank: true,
          tuition: true,
          acceptance: true,
          knownFor: true,
        },
      },
    },
  })

  return {
    country: (profile.destinationCountry as Country | null) ?? null,
    educationLevel: profile.educationLevel,
    degree: profile.degree,
    field: profile.field,
    gpa: Number(profile.gpa ?? 0),
    gradYear: profile.graduationYear,
    englishTest: profile.englishTest,
    intake: profile.preferredIntake,
    universities: shortlist.map(({ university }) => university),
    notSure: profile.openToRecommendations,
  } satisfies OnboardingInput
}

export async function writeStudentProfile(userId: string, input: OnboardingInput) {
  await prisma.$transaction(async (tx) => {
    await Promise.all(input.universities.map((university) =>
      tx.university.upsert({
        where: { id: university.id },
        create: university,
        update: university,
      }),
    ))
    await tx.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        destinationCountry: input.country
          ? input.country as unknown as Prisma.InputJsonValue
          : Prisma.JsonNull,
        educationLevel: input.educationLevel,
        degree: input.degree,
        field: input.field,
        gpa: input.gpa,
        graduationYear: input.gradYear,
        englishTest: input.englishTest,
        preferredIntake: input.intake,
        openToRecommendations: input.notSure,
        completedAt: new Date(),
      },
      update: {
        destinationCountry: input.country
          ? input.country as unknown as Prisma.InputJsonValue
          : Prisma.JsonNull,
        educationLevel: input.educationLevel,
        degree: input.degree,
        field: input.field,
        gpa: input.gpa,
        graduationYear: input.gradYear,
        englishTest: input.englishTest,
        preferredIntake: input.intake,
        openToRecommendations: input.notSure,
        completedAt: new Date(),
      },
    })
    await tx.studentShortlist.deleteMany({ where: { userId } })
    if (input.universities.length) {
      await tx.studentShortlist.createMany({
        data: input.universities.map(({ id }) => ({ userId, universityId: id })),
      })
    }
  })
  return readStudentProfile(userId)
}
