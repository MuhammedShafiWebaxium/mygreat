'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import NotificationCenter from '@/components/dashboard/NotificationCenter'
import {
  getNotificationsFn,
  markNotificationAsReadFn,
  markAllNotificationsAsReadFn,
  deleteNotificationFn,
  clearAllNotificationsFn,
} from '@/features/notifications/notification.functions'
import { getStaffThreads } from '@/features/support/support.functions'
import { speakNotification } from '@/lib/notifications'
import { useEffect } from 'react'

export default function AdminNotifications() {
  const queryClient = useQueryClient()

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['staff', 'notifications'],
    queryFn: async () => {
      return getNotificationsFn({ data: { page: 1, limit: 50 } })
    },
    refetchInterval: 10000,
  })

  const { data: threads } = useQuery({
    queryKey: ['staff', 'threads'],
    queryFn: () => getStaffThreads(),
    refetchInterval: 10000,
  })

  const markReadMutation = useMutation({
    mutationFn: (vars: { id: string; isRead?: boolean }) => markNotificationAsReadFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsReadFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotificationFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'notifications'] })
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: () => clearAllNotificationsFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'notifications'] })
    },
  })

  // Combine system notifications + support thread updates
  const items = (notifData?.items || []).concat(
    (threads || [])
      .filter((t: any) => t.unread > 0)
      .map((t: any) => ({
        id: `thread-${t.id}`,
        _id: `thread-${t.id}`,
        title: `New message from ${t.requesterName}`,
        message: `${t.unread} unread support message${t.unread > 1 ? 's' : ''} for ticket #${t.ticketNumber}: ${t.subject}`,
        description: `${t.unread} unread support message${t.unread > 1 ? 's' : ''} for ticket #${t.ticketNumber}: ${t.subject}`,
        kind: 'message',
        type: 'new_ticket',
        link: '/staff/messages',
        isRead: false,
        read: false,
        createdAt: t.lastMessageAt || new Date().toISOString(),
      }))
  )

  return (
    <div className="space-y-6">
      <NotificationCenter
        notices={items}
        loading={isLoading}
        onMarkRead={(id, isRead) => {
          if (!id.startsWith('thread-')) {
            markReadMutation.mutate({ id, isRead })
          }
        }}
        onMarkAll={() => markAllMutation.mutate()}
        onDelete={(id) => {
          if (!id.startsWith('thread-')) {
            deleteMutation.mutate(id)
          }
        }}
        onClearAll={() => clearAllMutation.mutate()}
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ['staff', 'notifications'] })
          await queryClient.invalidateQueries({ queryKey: ['staff', 'threads'] })
        }}
      />
    </div>
  )
}
