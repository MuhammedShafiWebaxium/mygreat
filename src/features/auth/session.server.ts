import '@tanstack/react-start/server-only'
import { createHmac, randomBytes } from 'node:crypto'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { prisma } from '@/db/client.server'
import { getServerEnv } from '@/config/env.server'
import type { AccountType } from './auth.schema'
import { withDatabaseRecoveryRetry } from '@/db/retry.server'

const SESSION_DAYS = 30

function cookieName() {
  return process.env.NODE_ENV === 'production' ? '__Host-mygreat_session' : 'mygreat_session'
}

function tokenHash(token: string) {
  return createHmac('sha256', getServerEnv().SESSION_SECRET).update(token).digest('hex')
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}

export async function createUserSession(userId: string, accountType: AccountType) {
  const token = randomBytes(32).toString('base64url')
  const data = { tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) }
  if (accountType === 'ADMIN') await withDatabaseRecoveryRetry(() => prisma.adminSession.create({ data: { ...data, adminId: userId } }))
  else if (accountType === 'PARTNER') await withDatabaseRecoveryRetry(() => prisma.partnerSession.create({ data: { ...data, partnerId: userId } }))
  else await withDatabaseRecoveryRetry(() => prisma.studentSession.create({ data: { ...data, studentId: userId } }))
  setCookie(cookieName(), `${accountType}.${token}`, cookieOptions())
}

export async function deleteUserSession() {
  const value = getCookie(cookieName())
  if (value) {
    const [accountType, token] = value.split('.', 2)
    if (token && accountType === 'ADMIN') await prisma.adminSession.deleteMany({ where: { tokenHash: tokenHash(token) } })
    else if (token && accountType === 'PARTNER') await prisma.partnerSession.deleteMany({ where: { tokenHash: tokenHash(token) } })
    else if (token && accountType === 'STUDENT') await prisma.studentSession.deleteMany({ where: { tokenHash: tokenHash(token) } })
  }
  deleteCookie(cookieName(), { path: '/' })
}

export async function getSessionUser() {
  const value = getCookie(cookieName())
  if (!value) return null
  const [accountType, token] = value.split('.', 2)
  if (!token || !['ADMIN', 'PARTNER', 'STUDENT'].includes(accountType)) return null
  const where = { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } }
  if (accountType === 'ADMIN') {
    const session = await withDatabaseRecoveryRetry(() => prisma.adminSession.findFirst({ where, include: { admin: true } }))
    if (!session?.admin.active) return null
    await withDatabaseRecoveryRetry(() => prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }))
    return sessionResult(session.admin, session.admin.role, 'ADMIN')
  }
  if (accountType === 'PARTNER') {
    const session = await withDatabaseRecoveryRetry(() => prisma.partnerSession.findFirst({ where, include: { partner: true } }))
    if (!session?.partner.active) return null
    await withDatabaseRecoveryRetry(() => prisma.partnerSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }))
    return sessionResult(session.partner, session.partner.role, 'PARTNER')
  }
  const session = await withDatabaseRecoveryRetry(() => prisma.studentSession.findFirst({ where, include: { student: true } }))
  if (!session?.student.active) return null
  await withDatabaseRecoveryRetry(() => prisma.studentSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }))
  return sessionResult(session.student, 'STUDENT', 'STUDENT')
}

function sessionResult(
  user: { id: string; name: string; email: string; phone: string | null; emailVerifiedAt: Date | null },
  role: import('./auth.schema').UserRole,
  accountType: AccountType,
) {
  return {
    id: user.id, name: user.name, email: user.email, phone: user.phone ?? undefined,
    role, accountType, emailVerified: Boolean(user.emailVerifiedAt),
  }
}
