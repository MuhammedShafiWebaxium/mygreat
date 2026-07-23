import 'server-only'
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

export async function updateApplication(
  actor: { id: string; role: UserRole },
  input: z.infer<typeof applicationUpdateSchema>,
) {
  const current = await prisma.application.findUnique({ where: { id: input.applicationId } })
  if (!current) throw new Error('Application not found.')

  if (actor.role === 'ADMISSIONS_EXECUTIVE') {
    if (current.admissionsExecutiveId !== actor.id) throw new Error('FORBIDDEN')
    if (input.visaStatus !== undefined || input.visaExecutiveId !== undefined) throw new Error('FORBIDDEN')
  } else if (actor.role === 'VISA_EXECUTIVE') {
    if (current.visaExecutiveId !== actor.id) throw new Error('FORBIDDEN')
    if (input.status !== undefined || input.admissionsExecutiveId !== undefined) throw new Error('FORBIDDEN')
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
