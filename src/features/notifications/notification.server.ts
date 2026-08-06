import '@tanstack/react-start/server-only'
import { prisma } from '@/db/client.server'
import type { NotificationKind } from '@/generated/prisma/client'

export interface NotificationFilterOptions {
  userId: string
  page?: number
  limit?: number
  filter?: 'all' | 'unread' | 'read'
  searchQuery?: string
}

export async function listNotificationsForUser({
  userId,
  page = 1,
  limit = 50,
  filter = 'all',
  searchQuery = '',
}: NotificationFilterOptions) {
  const skip = (page - 1) * limit

  const whereCondition: any = {
    userId,
    isDeleted: false,
  }

  if (filter === 'unread') {
    whereCondition.isRead = false
  } else if (filter === 'read') {
    whereCondition.isRead = true
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim()
    whereCondition.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: whereCondition,
    }),
  ])

  const formattedItems = items.map((n) => ({
    id: n.id,
    _id: n.id,
    userId: n.userId,
    kind: n.kind,
    type: n.type || n.kind.toLowerCase(),
    title: n.title,
    message: n.description,
    description: n.description,
    link: n.link ?? undefined,
    relatedId: n.relatedId ?? undefined,
    isRead: n.isRead || Boolean(n.readAt),
    isDeleted: n.isDeleted,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }))

  return {
    items: formattedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function getUnreadCountForUser(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isDeleted: false,
      isRead: false,
      readAt: null,
    },
  })
}

export async function markNotificationAsReadForUser(userId: string, notificationId: string, setStatus?: boolean) {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId, isDeleted: false },
  })

  if (!existing) {
    throw new Error('Notification not found')
  }

  const nextStatus = typeof setStatus === 'boolean' ? setStatus : !existing.isRead

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: nextStatus,
      readAt: nextStatus ? new Date() : null,
    },
  })

  return {
    id: updated.id,
    _id: updated.id,
    isRead: updated.isRead,
    readAt: updated.readAt ? updated.readAt.toISOString() : null,
  }
}

export async function markAllNotificationsAsReadForUser(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isDeleted: false,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return true
}

export async function deleteNotificationForUser(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isDeleted: true },
  })

  return notificationId
}

export async function clearAllNotificationsForUser(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isDeleted: false },
    data: { isDeleted: true },
  })

  return true
}

export async function createNotificationForUser(params: {
  userId: string
  title: string
  description: string
  kind?: NotificationKind
  type?: string
  link?: string
  relatedId?: string
}) {
  const created = await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      description: params.description,
      kind: params.kind || 'SYSTEM',
      type: params.type,
      link: params.link,
      relatedId: params.relatedId,
    },
  })

  return {
    id: created.id,
    _id: created.id,
    userId: created.userId,
    kind: created.kind,
    type: created.type || created.kind.toLowerCase(),
    title: created.title,
    message: created.description,
    description: created.description,
    link: created.link ?? undefined,
    relatedId: created.relatedId ?? undefined,
    isRead: created.isRead,
    isDeleted: created.isDeleted,
    createdAt: created.createdAt.toISOString(),
  }
}
