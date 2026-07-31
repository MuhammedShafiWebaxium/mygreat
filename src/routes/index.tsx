import { createFileRoute, redirect } from '@tanstack/react-router'
import Landing from '@/screens/Landing'
import { getCurrentUserFn } from '@/features/auth/auth.functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) throw redirect({ to: user.accountType === 'STUDENT' ? '/dashboard' : '/staff' })
  },
  component: Landing,
})
