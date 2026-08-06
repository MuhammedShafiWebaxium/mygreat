import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminNotifications from '@/screens/staff/AdminNotifications'
import { getCurrentUserFn } from '@/features/auth/auth.functions'

export const Route = createFileRoute('/staff/notifications')({
  beforeLoad: async () => {
    const u = await getCurrentUserFn()
    if (!u || u.accountType === 'STUDENT') throw redirect({ to: '/staff' })
  },
  component: AdminNotifications,
})
