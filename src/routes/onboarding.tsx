import { createFileRoute, redirect } from '@tanstack/react-router'
import Home from '@/screens/Home'
import { getCurrentUserFn } from '@/features/auth/auth.functions'

export const Route = createFileRoute('/onboarding')({
  head: () => ({ meta: [{ title: 'Plan your study abroad journey | Mygreat' }] }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) throw redirect({ to: user.accountType === 'STUDENT' ? '/dashboard' : '/staff' })
  },
  component: Home,
})
