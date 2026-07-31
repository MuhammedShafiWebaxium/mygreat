import { Suspense } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import Staff from '@/screens/Staff'
import { ClientOnly } from '@/components/ClientOnly'
import { getCurrentUserFn } from '@/features/auth/auth.functions'

export const Route = createFileRoute('/staff')({
  head: () => ({ meta: [{ title: 'Staff workspace | Mygreat' }, { name: 'robots', content: 'noindex' }] }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (!user) throw redirect({ to: '/login' })
    if (user.accountType === 'STUDENT') throw redirect({ to: '/dashboard' })
    return { user }
  },
  component: () => {
    const fallback = <div className="min-h-screen bg-[#060a18]" />
    return <ClientOnly fallback={fallback}><Suspense fallback={fallback}><Staff><Outlet /></Staff></Suspense></ClientOnly>
  },
})
