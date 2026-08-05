import { z } from 'zod'
import type { OnboardingData } from '@/types'

export const countrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  flag: z.string(),
  tagline: z.string(),
  universities: z.number().int().nonnegative(),
  avgTuition: z.string(),
  cities: z.array(z.string()),
})

export const universitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  countryId: z.string().min(1),
  rank: z.number().int().nonnegative(),
  tuition: z.string(),
  acceptance: z.string(),
  knownFor: z.string(),
})

export const onboardingSchema: z.ZodType<OnboardingData> = z.object({
  country: countrySchema.nullable(),
  countries: z.array(countrySchema).max(3).default([]),
  educationLevel: z.string().max(100),
  degree: z.string().max(160),
  field: z.string().max(1000),
  fields: z.array(z.string().min(1).max(1000)).max(3).default([]),
  feeMinInr: z.number().min(0).max(100000000).nullable().default(null),
  feeMaxInr: z.number().min(0).max(100000000).nullable().default(null),
  gpa: z.number().min(0).max(4),
  gradYear: z.string().max(20),
  englishTest: z.string().max(500),
  intake: z.string().max(100),
  universities: z.array(universitySchema).max(3),
  notSure: z.boolean(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
