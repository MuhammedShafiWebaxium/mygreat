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

export const agencyDetailsSchema=z.object({
  dateOfBirth:z.string().max(20).default(''),gender:z.string().max(40).default(''),maritalStatus:z.string().max(40).default(''),nationality:z.string().max(80).default(''),residenceCountry:z.string().max(80).default(''),addressLine:z.string().max(300).default(''),city:z.string().max(100).default(''),state:z.string().max(100).default(''),postalCode:z.string().max(20).default(''),passportStatus:z.string().max(40).default(''),passportNumber:z.string().max(40).default(''),passportExpiry:z.string().max(20).default(''),preferredContactMethod:z.string().max(40).default(''),whatsappNumber:z.string().max(30).default(''),emergencyContactName:z.string().max(120).default(''),emergencyContactRelation:z.string().max(80).default(''),emergencyContactPhone:z.string().max(30).default(''),fundingSource:z.string().max(80).default(''),sponsorName:z.string().max(120).default(''),educationLoanStatus:z.string().max(80).default(''),visaRefusalHistory:z.string().max(10).default('NO'),visaRefusalDetails:z.string().max(1000).default(''),travelHistory:z.string().max(1000).default(''),workExperienceYears:z.string().max(20).default(''),counsellingNotes:z.string().max(1500).default(''),
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
  agencyDetails:agencyDetailsSchema.optional(),
})

export const agencyProfileUpdateSchema=agencyDetailsSchema

export type OnboardingInput = z.infer<typeof onboardingSchema>
