import '@tanstack/react-start/server-only'
import { randomBytes } from 'node:crypto'
import type { z } from 'zod'
import { prisma } from '@/db/client.server'
import { hashPassword } from '@/features/auth/password.server'
import { sendPartnerCredentials } from './email.server'
import type { partnerRegistrationSchema, partnerReviewSchema } from './partner.schema'

export async function registerPartner(input: z.infer<typeof partnerRegistrationSchema>) {
  const duplicate = await prisma.partnerCompany.findFirst({
    where: { OR: [{ registrationNumber: input.registrationNumber }, { contactEmail: input.contactEmail }] },
    select: { id: true },
  })
  if (duplicate) throw new Error('A company application already exists with this registration number or email.')
  return prisma.partnerCompany.create({
    data: { ...input, website: input.website || null },
    select: { id: true, name: true, status: true, createdAt: true },
  })
}

export function listPartnerApplications() {
  return prisma.partnerCompany.findMany({
    include: { _count: { select: { partners: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function reviewPartner(
  reviewerId: string,
  input: z.infer<typeof partnerReviewSchema>,
) {
  const partner = await prisma.partnerCompany.findUnique({ where: { id: input.partnerCompanyId } })
  if (!partner) throw new Error('Partner application not found.')
  if (partner.status !== 'PENDING') throw new Error('This partner application has already been reviewed.')

  if (input.decision === 'REJECT') {
    return prisma.partnerCompany.update({
      where: { id: partner.id },
      data: { status: 'REJECTED', reviewNote: input.note || null, reviewedBy: reviewerId, reviewedAt: new Date() },
    })
  }

  if (await prisma.partner.findUnique({ where: { email: partner.contactEmail }, select: { id: true } })) {
    throw new Error('A partner account already uses this contact email.')
  }
  const temporaryPassword = randomBytes(18).toString('base64url')
  const passwordHash = await hashPassword(temporaryPassword)
  await prisma.$transaction(async (tx) => {
    await tx.partnerCompany.update({
      where: { id: partner.id },
      data: { status: 'APPROVED', reviewNote: input.note || null, reviewedBy: reviewerId, reviewedAt: new Date() },
    })
    await tx.partner.create({
      data: {
        partnerCompanyId: partner.id,
        name: partner.contactName,
        email: partner.contactEmail,
        phone: partner.contactPhone,
        passwordHash,
        role: 'PARTNER_ADMIN',
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
      },
    })
    await tx.auditLog.create({
      data: { actorId: reviewerId, action: 'PARTNER_APPROVED', entityType: 'partner_company', entityId: partner.id },
    })
  })
  await sendPartnerCredentials({
    to: partner.contactEmail,
    partnerName: partner.name,
    username: partner.contactEmail,
    password: temporaryPassword,
  })
  return prisma.partnerCompany.update({
    where: { id: partner.id },
    data: { credentialsSentAt: new Date() },
  })
}
