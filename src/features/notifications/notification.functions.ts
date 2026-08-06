import { createServerFn } from '@tanstack/react-start'
import { getSessionUser } from '@/features/auth/session.server'
import {
  clearAllNotificationsForUser,
  createNotificationForUser,
  deleteNotificationForUser,
  getUnreadCountForUser,
  listNotificationsForUser,
  markAllNotificationsAsReadForUser,
  markNotificationAsReadForUser,
} from './notification.server'
import type { NotificationKind } from '@/generated/prisma/client'

export interface GetNotificationsParams {
  page?: number
  limit?: number
  filter?: 'all' | 'unread' | 'read'
  searchQuery?: string
}

export const getNotificationsFn = createServerFn({ method: 'GET' })
  .validator((data?: GetNotificationsParams) => data ?? {})
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return listNotificationsForUser({
      userId: user.id,
      page: data.page ?? 1,
      limit: data.limit ?? 50,
      filter: data.filter ?? 'all',
      searchQuery: data.searchQuery ?? '',
    })
  })

export const getUnreadNotificationCountFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getSessionUser()
    if (!user) return { count: 0 }
    const count = await getUnreadCountForUser(user.id)
    return { count }
  })

export const markNotificationAsReadFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; isRead?: boolean }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return markNotificationAsReadForUser(user.id, data.id, data.isRead)
  })

export const markAllNotificationsAsReadFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return markAllNotificationsAsReadForUser(user.id)
  })

export const deleteNotificationFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return deleteNotificationForUser(user.id, data.id)
  })

export const clearAllNotificationsFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return clearAllNotificationsForUser(user.id)
  })

export const createNotificationFn = createServerFn({ method: 'POST' })
  .validator((data: {
    title: string
    description: string
    kind?: NotificationKind
    type?: string
    link?: string
    relatedId?: string
  }) => data)
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user) throw new Error('Authentication required.')
    return createNotificationForUser({
      userId: user.id,
      ...data,
    })
  })
