import { z } from 'zod'

export const createApplicationSchema = z.object({
  universityId: z.string().min(1),
  program: z.string().trim().min(2).max(200),
  deadline: z.iso.date().optional(),
})
export const applicationUpdateSchema = z.object({
  applicationId: z.uuid(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  visaStatus: z.enum(['NOT_STARTED', 'DOCUMENTS_PENDING', 'READY_TO_FILE', 'FILED', 'APPROVED', 'REJECTED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  nextAction: z.string().trim().min(1).max(300).optional(),
  admissionsExecutiveId: z.uuid().nullable().optional(),
  visaExecutiveId: z.uuid().nullable().optional(),
})
export const taskToggleSchema = z.object({ taskId: z.uuid(), completed: z.boolean() })

