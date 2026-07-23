import 'server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import { hashPassword } from '@/features/auth/password.server'
import type { UserRole } from '@/features/auth/auth.schema'
import type { Country } from '@/types'

const staffSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export async function createStaffUser(
  actorId: string,
  input: { name: string; email: string; phone?: string; password: string; role: Exclude<UserRole, 'STUDENT'> },
) {
  if (await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw new Error('An account already exists for this email address.')
  }
  return prisma.$transaction(async (tx) => {
    const staff = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        emailVerifiedAt: new Date(),
      },
      select: staffSelect,
    })
    await tx.auditLog.create({
      data: {
        actorId,
        action: 'STAFF_CREATED',
        entityType: 'user',
        entityId: staff.id,
        metadata: { role: staff.role },
      },
    })
    return staff
  })
}

export async function updateStaffUser(
  actorId: string,
  input: { userId: string; role: Exclude<UserRole, 'STUDENT'>; active: boolean },
) {
  if (actorId === input.userId && !input.active) throw new Error('You cannot deactivate your own account.')
  const existing = await prisma.user.findFirst({
    where: { id: input.userId, role: { not: 'STUDENT' } },
    select: { id: true, role: true },
  })
  if (!existing) throw new Error('Staff account not found.')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: { role: input.role, active: input.active },
      select: staffSelect,
    })
    await tx.auditLog.create({
      data: {
        actorId,
        action: 'STAFF_UPDATED',
        entityType: 'user',
        entityId: updated.id,
        metadata: { previousRole: existing.role, role: updated.role, active: updated.active },
      },
    })
    return updated
  })
}

export function listStaffUsers() {
  return prisma.user.findMany({
    where: { role: { not: 'STUDENT' } },
    select: staffSelect,
    orderBy: { name: 'asc' },
  })
}

export async function listStudentUsers(actor: { id: string; role: UserRole }) {
  const assignment = actor.role === 'ADMISSIONS_EXECUTIVE'
    ? { applications: { some: { admissionsExecutiveId: actor.id } } }
    : actor.role === 'VISA_EXECUTIVE'
      ? { applications: { some: { visaExecutiveId: actor.id } } }
      : {}

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', ...assignment },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      emailVerifiedAt: true,
      createdAt: true,
      profile: {
        select: {
          destinationCountry: true,
          degree: true,
          field: true,
          preferredIntake: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
  return students.map(({ profile, ...student }) => ({
    ...student,
    destinationCountry: (profile?.destinationCountry as Country | null) ?? null,
    degree: profile?.degree ?? null,
    field: profile?.field ?? null,
    preferredIntake: profile?.preferredIntake ?? null,
  }))
}

export async function readStaffQueue(actor: { id: string; role: UserRole }) {
  const where = actor.role === 'ADMISSIONS_EXECUTIVE'
    ? { admissionsExecutiveId: actor.id }
    : actor.role === 'VISA_EXECUTIVE'
      ? { visaExecutiveId: actor.id }
      : actor.role === 'SUPER_ADMIN'
        ? {}
        : null
  if (!where) throw new Error('FORBIDDEN')

  const rows = await prisma.application.findMany({
    where,
    include: {
      student: { select: { name: true } },
      university: { select: { name: true } },
    },
    orderBy: { student: { name: 'asc' } },
  })
  return rows.map(({ student, university, ...application }) => ({
    id: application.id,
    studentId: application.studentId,
    studentName: student.name,
    university: university.name,
    program: application.program,
    status: application.status,
    visaStatus: application.visaStatus,
    progress: application.progress,
    nextAction: application.nextAction,
    updatedAt: application.updatedAt,
  }))
}
