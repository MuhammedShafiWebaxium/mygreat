import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import { hashPassword } from '@/features/auth/password.server'
import type { AccountType, UserRole } from '@/features/auth/auth.schema'
import type { Country } from '@/types'

const adminRoles = ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE'] as const
type AdminRole = typeof adminRoles[number]
type PartnerRole = Exclude<UserRole, AdminRole | 'STUDENT'>

const staffSelect = {
  id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true,
} as const

async function companyPartnerIds(actorId: string) {
  const owner = await prisma.partner.findUnique({ where: { id: actorId }, select: { partnerCompanyId: true } })
  if (!owner) throw new Error('Partner company not found.')
  return (await prisma.partner.findMany({
    where: { partnerCompanyId: owner.partnerCompanyId },
    select: { id: true },
  })).map(({ id }) => id)
}

export async function createStaffUser(
  actor: { id: string; role: UserRole; accountType: AccountType },
  input: { name: string; email: string; phone?: string; password: string; role: Exclude<UserRole, 'STUDENT'> },
) {
  const accountType = adminRoles.includes(input.role as AdminRole) ? 'ADMIN' : 'PARTNER'
  if (actor.role === 'SUPER_ADMIN' && accountType !== 'ADMIN') {
    throw new Error('Partner staff must be created by their Partner Admin.')
  }
  if (actor.role === 'PARTNER_ADMIN' && (accountType !== 'PARTNER' || input.role === 'PARTNER_ADMIN')) {
    throw new Error('Partner Admins can only create admissions, visa, or reception staff.')
  }
  if (!['SUPER_ADMIN', 'PARTNER_ADMIN'].includes(actor.role)) throw new Error('FORBIDDEN')
  const partnerCompanyId = actor.role === 'PARTNER_ADMIN'
    ? (await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } }))?.partnerCompanyId
    : undefined
  if (actor.role === 'PARTNER_ADMIN' && !partnerCompanyId) throw new Error('Partner company not found.')
  const existing = accountType === 'ADMIN'
    ? await prisma.admin.findUnique({ where: { email: input.email }, select: { id: true } })
    : await prisma.partner.findUnique({ where: { email: input.email }, select: { id: true } })
  if (existing) throw new Error(`An ${accountType.toLowerCase()} account already exists for this email address.`)
  const passwordHash = await hashPassword(input.password)

  return prisma.$transaction(async (tx) => {
    const data = {
      name: input.name, email: input.email, phone: input.phone || null,
      passwordHash, emailVerifiedAt: new Date(),
    }
    const staff = accountType === 'ADMIN'
      ? await tx.admin.create({ data: { ...data, role: input.role as AdminRole }, select: staffSelect })
      : await tx.partner.create({ data: { ...data, role: input.role as PartnerRole, partnerCompanyId: partnerCompanyId! }, select: staffSelect })
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'STAFF_CREATED', entityType: accountType.toLowerCase(), entityId: staff.id, metadata: { role: staff.role } },
    })
    return { ...staff, accountType }
  })
}

export async function updateStaffUser(
  actor: { id: string; role: UserRole; accountType: AccountType },
  input: { userId: string; accountType: Exclude<AccountType, 'STUDENT'>; role: Exclude<UserRole, 'STUDENT'>; active: boolean },
) {
  if (actor.id === input.userId && !input.active) throw new Error('You cannot deactivate your own account.')
  const expectedType = adminRoles.includes(input.role as AdminRole) ? 'ADMIN' : 'PARTNER'
  if (expectedType !== input.accountType) throw new Error('A role cannot move an account between the admin and partner tables.')
  const existing = input.accountType === 'ADMIN'
    ? await prisma.admin.findUnique({ where: { id: input.userId }, select: { id: true, role: true } })
    : await prisma.partner.findUnique({ where: { id: input.userId }, select: { id: true, role: true } })
  if (!existing) throw new Error('Staff account not found.')
  if (actor.role === 'PARTNER_ADMIN') {
    if (input.accountType !== 'PARTNER' || input.role === 'PARTNER_ADMIN') throw new Error('FORBIDDEN')
    const owner = await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } })
    const target = await prisma.partner.findUnique({ where: { id: input.userId }, select: { partnerCompanyId: true } })
    if (!owner || !target || owner.partnerCompanyId !== target.partnerCompanyId) throw new Error('FORBIDDEN')
  } else if (actor.role !== 'SUPER_ADMIN') throw new Error('FORBIDDEN')

  return prisma.$transaction(async (tx) => {
    const updated = input.accountType === 'ADMIN'
      ? await tx.admin.update({ where: { id: input.userId }, data: { role: input.role as AdminRole, active: input.active }, select: staffSelect })
      : await tx.partner.update({ where: { id: input.userId }, data: { role: input.role as PartnerRole, active: input.active }, select: staffSelect })
    await tx.auditLog.create({
      data: { actorId: actor.id, action: 'STAFF_UPDATED', entityType: input.accountType.toLowerCase(), entityId: updated.id, metadata: { previousRole: existing.role, role: updated.role, active: updated.active } },
    })
    return { ...updated, accountType: input.accountType }
  })
}

export async function listStaffUsers(actor: { id: string; role: UserRole }) {
  if (actor.role === 'PARTNER_ADMIN') {
    const owner = await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } })
    if (!owner) throw new Error('Partner company not found.')
    const partners = await prisma.partner.findMany({
      where: { partnerCompanyId: owner.partnerCompanyId },
      select: staffSelect,
      orderBy: { name: 'asc' },
    })
    return partners.map((user) => ({ ...user, accountType: 'PARTNER' as const }))
  }
  if (actor.role !== 'SUPER_ADMIN') throw new Error('FORBIDDEN')
  const [admins, partners] = await Promise.all([
    prisma.admin.findMany({ select: staffSelect, orderBy: { name: 'asc' } }),
    prisma.partner.findMany({ select: staffSelect, orderBy: { name: 'asc' } }),
  ])
  return [
    ...admins.map((user) => ({ ...user, accountType: 'ADMIN' as const })),
    ...partners.map((user) => ({ ...user, accountType: 'PARTNER' as const })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

export async function listStudentUsers(actor: { id: string; role: UserRole }) {
  const partnerIds = actor.role === 'PARTNER_ADMIN'
    ? await companyPartnerIds(actor.id)
    : []
  const companyId = partnerIds.length
    ? (await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } }))?.partnerCompanyId
    : actor.role === 'ADMISSIONS_EXECUTIVE' || actor.role === 'VISA_EXECUTIVE' || actor.role === 'RECEPTION_EXECUTIVE'
      ? (await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } }))?.partnerCompanyId
      : undefined
  const assignedStudentIds = companyId
    ? (await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM students WHERE assigned_partner_company_id = ${companyId}::uuid
      `)).map(({ id }) => id)
    : null
  const assignment = assignedStudentIds ? { id: { in: assignedStudentIds } } : {}
  const students = await prisma.student.findMany({
    where: assignment,
    select: {
      id: true, name: true, email: true, phone: true, active: true, emailVerifiedAt: true, createdAt: true,
      profile: { select: { destinationCountry: true, degree: true, field: true, preferredIntake: true } },
    },
    orderBy: { name: 'asc' },
  })
  const assignments = students.length
    ? await prisma.$queryRaw<Array<{ studentId: string; partnerCompanyId: string | null; partnerCompanyName: string | null }>>(Prisma.sql`
        SELECT s.id AS "studentId",
               s.assigned_partner_company_id AS "partnerCompanyId",
               pc.name AS "partnerCompanyName"
        FROM students s
        LEFT JOIN partner_companies pc ON pc.id = s.assigned_partner_company_id
        WHERE s.id IN (${Prisma.join(students.map(({ id }) => Prisma.sql`${id}::uuid`))})
      `)
    : []
  const assignmentByStudent = new Map(assignments.map((item) => [item.studentId, item]))
  return students.map(({ profile, ...student }) => ({
    ...student,
    assignedPartnerCompanyId: assignmentByStudent.get(student.id)?.partnerCompanyId ?? null,
    partnerCompanyName: actor.role === 'SUPER_ADMIN' ? assignmentByStudent.get(student.id)?.partnerCompanyName ?? null : undefined,
    destinationCountry: (profile?.destinationCountry as Country | null) ?? null,
    degree: profile?.degree ?? null,
    field: profile?.field ?? null,
    preferredIntake: profile?.preferredIntake ?? null,
  }))
}

export async function readStaffQueue(actor: { id: string; role: UserRole }) {
  const partnerIds = actor.role === 'PARTNER_ADMIN'
    ? await companyPartnerIds(actor.id)
    : []
  const companyId = partnerIds.length
    ? (await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } }))?.partnerCompanyId
    : ['ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'RECEPTION_EXECUTIVE'].includes(actor.role)
      ? (await prisma.partner.findUnique({ where: { id: actor.id }, select: { partnerCompanyId: true } }))?.partnerCompanyId
      : undefined
  const assignedStudentIds = companyId
    ? (await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM students WHERE assigned_partner_company_id = ${companyId}::uuid
      `)).map(({ id }) => id)
    : null
  const where = assignedStudentIds
    ? { studentId: { in: assignedStudentIds } }
      : adminRoles.includes(actor.role as AdminRole) || actor.role === 'RECEPTION_EXECUTIVE' ? {} : null
  if (!where) throw new Error('FORBIDDEN')
  const rows = await prisma.application.findMany({
    where, include: { student: { select: { name: true } }, university: { select: { name: true } } },
    orderBy: { student: { name: 'asc' } },
  })
  return rows.map(({ student, university, ...application }) => ({
    id: application.id, studentId: application.studentId, studentName: student.name,
    university: university.name, program: application.program, status: application.status,
    visaStatus: application.visaStatus, progress: application.progress,
    nextAction: application.nextAction, createdAt: application.createdAt, updatedAt: application.updatedAt,
  }))
}

export async function readPrimaryApplicationQueue(actor: { id: string; role: UserRole }) {
  const applications = await readStaffQueue(actor)
  const primaryByStudent = new Map<string, (typeof applications)[number]>()
  for (const application of applications) {
    const current = primaryByStudent.get(application.studentId)
    if (!current
      || application.createdAt < current.createdAt
      || (application.createdAt.getTime() === current.createdAt.getTime() && application.id < current.id)) {
      primaryByStudent.set(application.studentId, application)
    }
  }
  return [...primaryByStudent.values()].sort((a, b) => a.studentName.localeCompare(b.studentName))
}

export async function listAssignmentOptions(actor: { role: UserRole }) {
  const [companies, universities] = await Promise.all([
    actor.role === 'SUPER_ADMIN' ? prisma.partnerCompany.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }) : Promise.resolve([]),
    prisma.university.findMany({
      where: { active: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { companies, universities }
}

export async function assignStudentToPartner(
  actorId: string,
  input: { studentId: string; partnerCompanyId: string | null },
) {
  if (input.partnerCompanyId) {
    const company = await prisma.partnerCompany.findUnique({
      where: { id: input.partnerCompanyId },
      select: { status: true },
    })
    if (!company || company.status !== 'APPROVED') throw new Error('Only approved partners can receive students.')
  }
  return prisma.$transaction(async (tx) => {
    const changed = await tx.$executeRaw(Prisma.sql`
      UPDATE students
      SET assigned_partner_company_id = ${input.partnerCompanyId}::uuid,
          updated_at = NOW()
      WHERE id = ${input.studentId}::uuid
    `)
    if (!changed) throw new Error('Student not found.')
    await tx.auditLog.create({
      data: {
        actorId, action: input.partnerCompanyId ? 'STUDENT_ASSIGNED' : 'STUDENT_UNASSIGNED',
        entityType: 'student', entityId: input.studentId,
        metadata: { partnerCompanyId: input.partnerCompanyId },
      },
    })
    return { id: input.studentId, assignedPartnerCompanyId: input.partnerCompanyId }
  })
}

export async function readStudentProfileForStaff(
  actor: { id: string; role: UserRole; accountType: AccountType },
  studentId: string,
) {
  if (actor.accountType === 'PARTNER') {
    const partner = await prisma.partner.findUnique({
      where: { id: actor.id },
      select: { partnerCompanyId: true },
    })
    const [assignment] = await prisma.$queryRaw<Array<{ partnerCompanyId: string | null }>>(Prisma.sql`
      SELECT assigned_partner_company_id AS "partnerCompanyId"
      FROM students WHERE id = ${studentId}::uuid
    `)
    if (!partner || assignment?.partnerCompanyId !== partner.partnerCompanyId) throw new Error('FORBIDDEN')
  } else if (actor.accountType !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true, name: true, email: true, phone: true, active: true, emailVerifiedAt: true, createdAt: true,
      profile: true,
      shortlist: { include: { university: true }, orderBy: { createdAt: 'asc' } },
      applications: {
        include: { university: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
      documents: { select: { id: true, name: true, status: true, note: true, storageKey: true }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!student) throw new Error('Student not found.')
  return {
    ...student,
    profile: student.profile ? { ...student.profile, gpa: student.profile.gpa === null ? null : Number(student.profile.gpa) } : null,
    applications: student.applications.map(({ university, ...application }) => ({
      ...application,
      quotedFeeAmount: application.quotedFeeAmount === null ? null : application.quotedFeeAmount.toString(),
      university,
    })),
  }
}

export async function readDocumentReviewQueue(actor: { id: string; role: UserRole }) {
  const visibleStudents = await listStudentUsers(actor)
  if (!visibleStudents.length) return []
  const documents = await prisma.document.findMany({
    where: { userId: { in: visibleStudents.map(student => student.id) }, storageKey: { not: null } },
    select: { userId: true, status: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
  const byStudent = new Map<string, { uploaded: number; pending: number; verified: number; needsAction: number; lastUploadedAt: Date }>()
  for (const document of documents) {
    const current = byStudent.get(document.userId) ?? { uploaded: 0, pending: 0, verified: 0, needsAction: 0, lastUploadedAt: document.updatedAt }
    current.uploaded += 1
    if (document.status === 'PENDING') current.pending += 1
    if (document.status === 'VERIFIED') current.verified += 1
    if (document.status === 'NEEDED' || document.status === 'REJECTED') current.needsAction += 1
    if (document.updatedAt > current.lastUploadedAt) current.lastUploadedAt = document.updatedAt
    byStudent.set(document.userId, current)
  }
  return visibleStudents.flatMap(student => {
    const counts = byStudent.get(student.id)
    return counts ? [{
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      ...counts,
    }] : []
  }).sort((left, right) =>
    Number(right.pending > 0) - Number(left.pending > 0)
    || right.lastUploadedAt.getTime() - left.lastUploadedAt.getTime()
  )
}

export async function readPartnerProfileForStaff(
  actor: { accountType: AccountType },
  partnerCompanyId: string,
) {
  if (actor.accountType !== 'ADMIN') throw new Error('FORBIDDEN')
  const partner = await prisma.partnerCompany.findUnique({
    where: { id: partnerCompanyId },
    include: {
      partners: {
        select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
      },
    },
  })
  if (!partner) throw new Error('Partner profile not found.')
  const [studentCount] = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM students WHERE assigned_partner_company_id = ${partnerCompanyId}::uuid
  `)
  return { ...partner, assignedStudentCount: Number(studentCount?.count ?? 0) }
}
