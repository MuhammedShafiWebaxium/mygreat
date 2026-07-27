import { z } from 'zod'

export const partnerRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Company name must contain at least 2 characters.').max(160),
  registrationNumber: z.string().trim().min(2, 'Registration number must contain at least 2 characters.').max(80),
  website: z.union([z.url(), z.literal('')]).optional(),
  address: z.string().trim().min(5, 'Registered address must contain at least 5 characters.').max(500),
  country: z.string().trim().min(2, 'Country must contain at least 2 characters.').max(100),
  contactName: z.string().trim().min(2, 'Partner administrator name must contain at least 2 characters.').max(120),
  contactEmail: z.email().transform((value) => value.trim().toLowerCase()),
  contactPhone: z.string().trim().min(5, 'Partner administrator phone must contain at least 5 characters.').max(30),
})

export const partnerReviewSchema = z.object({
  partnerCompanyId: z.uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().max(1000).optional(),
})
