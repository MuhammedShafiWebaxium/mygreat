import { z } from 'zod'
import { onboardingSchema } from '@/features/profile/profile.schema'

export const partnerRoleSchema = z.enum([
  'PARTNER_ADMIN',
  'ADMISSIONS_EXECUTIVE',
  'VISA_EXECUTIVE',
  'RECEPTION_EXECUTIVE',
])
export const adminRoleSchema = z.enum([
  'SUPER_ADMIN',
  'MARKETING_EXECUTIVE',
  'FINANCE_EXECUTIVE',
  'SUPPORT_EXECUTIVE',
])
export const userRoleSchema = z.union([adminRoleSchema, partnerRoleSchema, z.literal('STUDENT')])
export const accountTypeSchema = z.enum(['ADMIN', 'PARTNER', 'STUDENT'])
export type UserRole = z.infer<typeof userRoleSchema>
export type AccountType = z.infer<typeof accountTypeSchema>

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
  accountType: accountTypeSchema,
})
export const createStaffSchema = accountSchema.extend({
  password: z.string().min(12).max(128),
  role: z.union([adminRoleSchema, partnerRoleSchema]),
})
export const updateStaffSchema = z.object({
  userId: z.uuid(),
  accountType: z.enum(['ADMIN', 'PARTNER']),
  role: z.union([adminRoleSchema, partnerRoleSchema]),
  active: z.boolean(),
})

export type Account = z.infer<typeof accountSchema>
