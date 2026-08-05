import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { Country } from '@/types'
import type { OnboardingInput } from './profile.schema'
import { agencyDetailsSchema } from './profile.schema'
import type { z } from 'zod'

export async function readStudentProfile(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return null
  const [agencyRow]=await prisma.$queryRaw<Array<{agencyDetails:unknown}>>(Prisma.sql`SELECT agency_details AS "agencyDetails" FROM student_profiles WHERE user_id=${userId}::uuid`)
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

  const country=(profile.destinationCountry as Country | null) ?? null
  const fields=profile.field.split(',').map(value=>value.trim()).filter(Boolean).slice(0,3)
  return {
    country,
    countries: country ? [country] : [],
    educationLevel: profile.educationLevel,
    degree: profile.degree,
    field: profile.field,
    fields,
    feeMinInr: profile.feeMinInr===null?null:Number(profile.feeMinInr),
    feeMaxInr: profile.feeMaxInr===null?null:Number(profile.feeMaxInr),
    gpa: Number(profile.gpa ?? 0),
    gradYear: profile.graduationYear,
    englishTest: profile.englishTest,
    intake: profile.preferredIntake,
    universities: shortlist.map(({ university }) => university),
    notSure: profile.openToRecommendations,
    agencyDetails:agencyDetailsSchema.parse(agencyRow?.agencyDetails??{}),
  } satisfies OnboardingInput
}

export async function writeStudentProfile(userId: string, input: OnboardingInput) {
  const existing=await prisma.studentProfile.findUnique({where:{userId},select:{completedAt:true}})
  if(existing?.completedAt)throw new Error('Academic and study preferences are locked after onboarding. Contact your counsellor to request changes.')
  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        destinationCountry: input.country
          ? input.country as unknown as Prisma.InputJsonValue
          : Prisma.JsonNull,
        educationLevel: input.educationLevel,
        degree: input.degree,
        field: input.fields.join(', ') || input.field,
        feeMinInr: input.feeMinInr,
        feeMaxInr: input.feeMaxInr,
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
        field: input.fields.join(', ') || input.field,
        feeMinInr: input.feeMinInr,
        feeMaxInr: input.feeMaxInr,
        gpa: input.gpa,
        graduationYear: input.gradYear,
        englishTest: input.englishTest,
        preferredIntake: input.intake,
        openToRecommendations: input.notSure,
        completedAt: new Date(),
      },
    })
    await tx.$executeRaw(Prisma.sql`UPDATE student_profiles SET agency_details=${JSON.stringify(input.agencyDetails??{})}::jsonb WHERE user_id=${userId}::uuid`)
    await tx.studentShortlist.deleteMany({ where: { userId } })
    if (input.universities.length) {
      await tx.studentShortlist.createMany({
        data: input.universities.map(({ id }) => ({ userId, universityId: id })),
      })
    }
  })
  return readStudentProfile(userId)
}

export async function updateStudentAgencyProfile(userId:string,input:z.infer<typeof agencyDetailsSchema>){
  await prisma.$executeRaw(Prisma.sql`UPDATE student_profiles SET agency_details=${JSON.stringify(input)}::jsonb,updated_at=NOW() WHERE user_id=${userId}::uuid`)
  return readStudentProfile(userId)
}

export async function addStudentShortlistedUniversity(userId:string,universityId:string){
  await prisma.$transaction(async(tx)=>{
    const existing=await tx.studentShortlist.findUnique({where:{userId_universityId:{userId,universityId}}})
    if(existing)return
    const count=await tx.studentShortlist.count({where:{userId}})
    if(count>=3)throw new Error('You can shortlist up to three universities.')
    await tx.studentShortlist.create({data:{userId,universityId}})
  })
  return readStudentProfile(userId)
}
