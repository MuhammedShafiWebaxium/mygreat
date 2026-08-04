import { z } from 'zod'

export const createApplicationSchema = z.object({
  universityId: z.string().min(1),
  program: z.string().trim().min(2).max(200),
  deadline: z.iso.date().optional(),
})
export const applicationUpdateSchema = z.object({
  applicationId: z.uuid(),
  progress: z.number().int().min(0).max(100).optional(),
  nextAction: z.string().trim().min(1).max(300).optional(),
  admissionsExecutiveId: z.uuid().nullable().optional(),
  visaExecutiveId: z.uuid().nullable().optional(),
})
export const taskToggleSchema = z.object({ taskId: z.uuid(), completed: z.boolean() })

export const workflowCaseActionSchema = z.object({
  applicationId: z.uuid(),
  visaAttemptId: z.uuid().nullable().optional(),
  workflowType: z.enum(['APPLICATION', 'VISA']),
  targetStage: z.string().trim().min(1).max(80),
  outcome: z.string().trim().max(80).optional(),
  approvalStage: z.enum(['VISA_LEVEL_1_VERIFICATION','VISA_LEVEL_2_VERIFICATION']).optional(),
  approvalRequestId: z.uuid().optional(),
  offerType: z.enum(['CONDITIONAL','UNCONDITIONAL']).nullable().optional(),
  note: z.string().trim().max(2000).default(''),
  expectedCompletionAt: z.iso.datetime().nullable().optional(),
  expectedCompletionEndAt: z.iso.datetime().nullable().optional(),
  nextFollowUpAt: z.iso.datetime().nullable().optional(),
  assignedStaffId: z.uuid().nullable().optional(),
  assignedStaffName: z.string().trim().max(120).nullable().optional(),
  reapplyMode: z.enum(['APPEAL', 'NEW_ATTEMPT']).optional(),
  restartStage: z.string().trim().max(80).optional(),
})

export const priorityApplicationSchema=z.object({applicationId:z.uuid()})

export const staffCreateApplicationSchema = z.object({
  studentId: z.uuid(),
  universityId: z.string().min(1),
  program: z.string().trim().min(2).max(200),
  deadline: z.iso.date().optional(),
})

export const assignStudentSchema = z.object({
  studentId: z.uuid(),
  partnerCompanyId: z.uuid().nullable(),
})
