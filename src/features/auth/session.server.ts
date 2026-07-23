import 'server-only'
import { createHmac, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/db/client.server'
import { getServerEnv } from '@/config/env.server'

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

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
    },
  })
  ;(await cookies()).set(cookieName(), token, cookieOptions())
}

export async function deleteUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieName())?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } })
  }
  cookieStore.delete({ name: cookieName(), path: '/' })
}

export async function getSessionUser() {
  const token = (await cookies()).get(cookieName())?.value
  if (!token) return null

  const session = await prisma.session.findFirst({
    where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          emailVerifiedAt: true,
        },
      },
    },
  })
  if (!session?.user.active) return null
  await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone ?? undefined,
    role: session.user.role,
    emailVerified: Boolean(session.user.emailVerifiedAt),
  }
}
