import '@tanstack/react-start/server-only'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import type { UserRole } from '@/features/auth/auth.schema'
import type { z } from 'zod'
import type { applicationUpdateSchema, createApplicationSchema } from './workflow.schema'

const dateOnly = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null

export async function createApplication(userId: string, input: z.infer<typeof createApplicationSchema>) {
  await assertRequiredDocumentsVerified(userId)
  const shortlisted = await prisma.studentShortlist.findUnique({
    where: { userId_universityId: { userId, universityId: input.universityId } },
    select: { universityId: true },
  })
  if (!shortlisted) throw new Error('Add the university to your shortlist first.')
  const application = await prisma.application.create({
    data: {
      studentId: userId,
      universityId: input.universityId,
      program: input.program,
      applicationDeadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
    },
  })
  await snapshotCourseFee(application.id, input.universityId, input.program)
  return application
}

async function snapshotCourseFee(applicationId: string, universityId: string, program: string) {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE applications a SET
      course_id = priced.course_id, quoted_fee_amount = priced.amount,
      quoted_fee_currency = priced.currency_code, fee_quoted_at = NOW()
    FROM (
      SELECT c.id AS course_id, f.amount, f.currency_code
      FROM courses c JOIN course_fees f ON f.course_id = c.id
      WHERE c.university_id = ${universityId} AND LOWER(c.name) = LOWER(${program})
        AND c.active = TRUE AND f.effective_from <= NOW()
        AND (f.effective_to IS NULL OR f.effective_to > NOW())
      ORDER BY f.effective_from DESC LIMIT 1
    ) priced WHERE a.id = ${applicationId}::uuid
  `)
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
  await assertRequiredDocumentsVerified(input.studentId)
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
    await tx.$executeRaw(Prisma.sql`
      UPDATE applications a SET course_id=priced.course_id, quoted_fee_amount=priced.amount,
        quoted_fee_currency=priced.currency_code, fee_quoted_at=NOW()
      FROM (SELECT c.id course_id, f.amount, f.currency_code FROM courses c JOIN course_fees f ON f.course_id=c.id
        WHERE c.university_id=${input.universityId} AND LOWER(c.name)=LOWER(${input.program}) AND c.active=TRUE
          AND f.effective_from<=NOW() AND (f.effective_to IS NULL OR f.effective_to>NOW()) ORDER BY f.effective_from DESC LIMIT 1) priced
      WHERE a.id=${created.id}::uuid
    `)
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

const requiredDocumentNames: Record<string, string> = {
  passport: 'Passport',
  'passport-photo': 'Passport-size photograph',
  cv: 'CV or résumé',
  aadhaar: 'Aadhaar',
}

async function assertRequiredDocumentsVerified(userId: string) {
  const names = Object.values(requiredDocumentNames)
  const verified = await prisma.document.count({
    where: { userId, name: { in: names }, status: 'VERIFIED' },
  })
  if (verified !== names.length) {
    throw new Error('All required documents must be verified before an application can be created.')
  }
}

let documentFilesReady:Promise<void>|undefined
function ensureDocumentFiles(){documentFilesReady??=(async()=>{await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS document_files (document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,file_name TEXT NOT NULL,mime_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,file_data BYTEA NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)})();return documentFilesReady}

export async function uploadRequiredDocument(userId:string,documentType:string,file:File) {
  const name=requiredDocumentNames[documentType]
  if(!name) throw new Error('Unknown required document type.')
  if(file.size>10*1024*1024) throw new Error('Files must be 10 MB or smaller.')
  await ensureDocumentFiles()
  const bytes=Buffer.from(await file.arrayBuffer())
  const existing=await prisma.document.findFirst({where:{userId,name}})
  const document=existing?await prisma.document.update({where:{id:existing.id},data:{status:'PENDING',note:'Uploaded and awaiting verification.',storageKey:`db:${existing.id}`,verifiedBy:null}}):await prisma.document.create({data:{userId,name,status:'PENDING',note:'Uploaded and awaiting verification.'}})
  await prisma.$executeRaw(Prisma.sql`INSERT INTO document_files(document_id,file_name,mime_type,size_bytes,file_data) VALUES(${document.id}::uuid,${file.name},${file.type||'application/octet-stream'},${file.size},${bytes}) ON CONFLICT(document_id) DO UPDATE SET file_name=EXCLUDED.file_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,file_data=EXCLUDED.file_data,updated_at=NOW()`)
  if(!document.storageKey) await prisma.document.update({where:{id:document.id},data:{storageKey:`db:${document.id}`}})
  return {...document,fileName:file.name,size:file.size}
}

export async function readDocumentFile(
  documentId: string,
  actor: { id: string; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
) {
  await ensureDocumentFiles()
  const [file] = await prisma.$queryRaw<Array<{ userId: string; fileName: string; mimeType: string; fileData: Uint8Array }>>(Prisma.sql`
    SELECT d.user_id AS "userId", f.file_name AS "fileName", f.mime_type AS "mimeType", f.file_data AS "fileData"
    FROM document_files f
    JOIN documents d ON d.id = f.document_id
    WHERE f.document_id = ${documentId}::uuid
  `)
  if(!file) throw new Error('Document file not found.')
  if (actor.accountType === 'STUDENT' && file.userId !== actor.id) throw new Error('FORBIDDEN')
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, file.userId)
  return file
}

export async function reviewDocument(
  actor: { id: string; accountType: 'ADMIN' | 'PARTNER' | 'STUDENT' },
  documentId: string,
  status: 'VERIFIED' | 'NEEDED',
  note: string,
) {
  const current = await prisma.document.findUnique({ where: { id: documentId }, select: { userId: true } })
  if (!current) throw new Error('Document not found.')
  if (actor.accountType === 'PARTNER') await assertPartnerCanAccessStudent(actor.id, current.userId)
  else if (actor.accountType !== 'ADMIN') throw new Error('FORBIDDEN')
  const document=await prisma.document.update({where:{id:documentId},data:{status,note:note||(status==='VERIFIED'?'Verified by staff.':'A replacement file is required.'),verifiedBy:actor.accountType==='PARTNER'&&status==='VERIFIED'?actor.id:null}})
  await prisma.auditLog.create({data:{actorId:actor.id,action:status==='VERIFIED'?'DOCUMENT_VERIFIED':'DOCUMENT_REJECTED',entityType:'document',entityId:documentId,metadata:{note}}})
  return document
}
