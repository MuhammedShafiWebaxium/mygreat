import { z } from 'zod'
import { onboardingSchema } from '@/features/profile/profile.schema'

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMISSIONS_EXECUTIVE',
  'VISA_EXECUTIVE',
  'STUDENT',
])
export type UserRole = z.infer<typeof userRoleSchema>

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((email) => email.trim().toLowerCase()),
  phone: z.string().trim().max(30).optional(),
})

export const registerSchema = accountSchema.extend({
  password: z.string().min(8).max(128),
  onboarding: onboardingSchema,
})
export const loginSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1).max(128),
})
export const createStaffSchema = accountSchema.extend({
  password: z.string().min(12).max(128),
  role: userRoleSchema.exclude(['STUDENT']),
})
export const updateStaffSchema = z.object({
  userId: z.uuid(),
  role: userRoleSchema.exclude(['STUDENT']),
  active: z.boolean(),
})

export type Account = z.infer<typeof accountSchema>

