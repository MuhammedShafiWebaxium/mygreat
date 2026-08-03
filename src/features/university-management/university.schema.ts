import { z } from 'zod'

const id = z.string().uuid()
export const countrySchema = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), code: z.string().trim().length(2).or(z.string().trim().length(3)), currencyCode: z.string().trim().length(3), active: z.boolean().default(true) })
const optionalText = z.string().trim().max(5000).default('')
export const universitySchema = z.object({
  id: z.string().optional(), name: z.string().trim().min(2).max(180), city: z.string().trim().min(2).max(100),
  countryId: id, website: z.string().trim().max(500).default('').refine(value => !value || /^https?:\/\//i.test(value), 'Website must start with http:// or https://.'),
  rank: z.coerce.number().int().min(0).default(0), tuition: z.string().trim().max(100).default(''), acceptance: z.string().trim().max(100).default(''),
  knownFor: z.string().trim().max(200).default(''), active: z.boolean().default(true),
  rankings: z.array(z.object({ name: z.string().trim().min(2).max(150), value: z.string().trim().min(1).max(100) })).default([]),
})
export const courseSchema = z.object({
  id: id.optional(), universityId: z.string().min(1), name: z.string().trim().min(2).max(1000), code: z.string().trim().min(1).max(30),
  level: z.string().trim().min(2).max(80), durationMonths: z.coerce.number().int().min(0).max(240), active: z.boolean().default(true),
  campus: optionalText, intakeMonth: z.array(z.string().trim().min(1)).default([]), intakeYear: optionalText,
  tuitionFee: optionalText, ranking: optionalText, ielts: optionalText, ieltsMin: optionalText, toefl: optionalText,
  toeflMin: optionalText, pte: optionalText, pteMin: optionalText, applicationDeadline: optionalText,
  scholarshipAvailable: optionalText, requirements: optionalText, backlogRange: optionalText, remarks: optionalText,
  applicationMode: optionalText, englishProficiency: optionalText, entryRequirements: optionalText,
})
export const feeSchema = z.object({ courseId: id, amount: z.coerce.number().min(0), currencyCode: z.string().trim().length(3), effectiveFrom: z.coerce.date() })
export const deleteSchema = z.discriminatedUnion('entity', [
  z.object({ entity: z.literal('country'), id }),
  // University IDs include legacy string identifiers as well as newer UUIDs.
  z.object({ entity: z.literal('university'), id: z.string().trim().min(1).max(191) }),
  z.object({ entity: z.literal('course'), id }),
])
