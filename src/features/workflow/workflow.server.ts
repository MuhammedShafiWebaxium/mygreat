import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { UserRole } from '@/features/auth/auth.schema'
import type { z } from 'zod'
import type { applicationUpdateSchema, createApplicationSchema } from './workflow.schema'

const dateOnly = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null

export async function createApplication(userId: string, input: z.infer<typeof createApplicationSchema>) {
  const shortlisted = await prisma.studentShortlist.findUnique({
    where: { userId_universityId: { userId, universityId: input.universityId } },
    select: { universityId: true },
  })
  if (!shortlisted) throw new Error('Add the university to your shortlist first.')
  return prisma.application.create({
    data: {
      studentId: userId,
      universityId: input.universityId,
      program: input.program,
      applicationDeadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
    },
  })
}

async function assertPartnerCanAccessStudent(actorId: string, studentId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: actorId },
    select: { partnerCompanyId: true, partnerCompany: { select: { status: true } } },
  })
  if (!partner || partner.partnerCompany.status !== 'APPROVED') throw new Error('FORBIDDEN')
  const [student] = await prisma.$queryRaw<Array<{ assignedPartnerCompanyId: string | null }>>(Prisma.sql`
    SELECT assigned_partner_company_id AS "assignedPartnerCompanyId"
    FROM students
    WHERE id = ${studentId}::uuid
  `)
  if (!student || student.assignedPartnerCompanyId !== partner.partnerCompanyId) throw new Error('FORBIDDEN')
}

export async function createApplicationForStudent(
  actor: { id: string; role: UserRole; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
  input: { studentId: string; universityId: string; program: string; deadline?: string },
) {
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, input.studentId)
  else if (actor.accountType !== 'ADMIN') throw new Error('FORBIDDEN')
  const duplicate = await prisma.application.findFirst({
    where: { studentId: input.studentId, universityId: input.universityId, program: input.program },
    select: { id: true },
  })
  if (duplicate) throw new Error('An application for this university and program already exists.')
  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        studentId: input.studentId,
        universityId: input.universityId,
        program: input.program,
        applicationDeadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
        admissionsExecutiveId: actor.role === 'ADMISSIONS_EXECUTIVE' ? actor.id : null,
        visaExecutiveId: actor.role === 'VISA_EXECUTIVE' ? actor.id : null,
      },
    })
    await tx.auditLog.create({
      data: {
        actorId: actor.id, action: 'APPLICATION_CREATED', entityType: 'application',
        entityId: created.id, metadata: { studentId: input.studentId },
      },
    })
    return created
  })
  return application
}

export async function updateApplication(
  actor: { id: string; role: UserRole },
  input: z.infer<typeof applicationUpdateSchema>,
) {
  const current = await prisma.application.findUnique({ where: { id: input.applicationId } })
  if (!current) throw new Error('Application not found.')

  if (actor.role === 'ADMISSIONS_EXECUTIVE') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.visaStatus !== undefined || input.visaExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role === 'VISA_EXECUTIVE') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.status !== undefined || input.admissionsExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role === 'PARTNER_ADMIN') {
    await assertPartnerCanAccessStudent(actor.id, current.studentId)
    if (input.admissionsExecutiveId !== undefined || input.visaExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN')
  }

  const { applicationId, ...changes } = input
  return prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: changes,
    })
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'APPLICATION_UPDATED',
        entityType: 'application',
        entityId: applicationId,
        metadata: changes as Prisma.InputJsonValue,
      },
    })
    return updated
  })
}

export async function readStudentDashboard(userId: string) {
  const [applicationRows, taskRows, documentRows, deadlineRows, notificationRows] = await Promise.all([
    prisma.application.findMany({
      where: { studentId: userId },
      include: { university: true },
    }),
    prisma.task.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId } }),
    prisma.deadline.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
  ])
  return {
    applications: applicationRows.map(({ university, ...application }) => ({
      id: application.id,
      universityId: university.id,
      universityName: university.name,
      city: university.city,
      rank: university.rank,
      program: application.program,
      status: application.status,
      visaStatus: application.visaStatus,
      progress: application.progress,
      nextAction: application.nextAction,
      deadline: dateOnly(application.applicationDeadline),
    })),
    tasks: taskRows.map((task) => ({ ...task, dueDate: dateOnly(task.dueDate) })),
    documents: documentRows,
    deadlines: deadlineRows.map((deadline) => ({ ...deadline, dueDate: dateOnly(deadline.dueDate)! })),
    notifications: notificationRows.map((notice) => ({ ...notice, createdAt: notice.createdAt.toISOString() })),
  }
}

export async function setTaskCompleted(userId: string, taskId: string, completed: boolean) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { completed },
  })
  if (!result.count) throw new Error('Task not found.')
  return prisma.task.findUniqueOrThrow({ where: { id: taskId } })
}
