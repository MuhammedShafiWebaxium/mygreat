import { Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import Dashboard from '@/screens/student/Dashboard'
import { ClientOnly } from '@/components/ClientOnly'
import { getCurrentUserFn } from '@/features/auth/auth.functions'

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Dashboard | Mygreat' }, { name: 'robots', content: 'noindex' }] }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (!user) throw redirect({ to: '/' })
    if (user.accountType !== 'STUDENT') throw redirect({ to: '/staff' })
  },
  component: () => {
    const fallback = <div className="min-h-screen bg-[#070b18]" />
    return <ClientOnly fallback={fallback}><Suspense fallback={fallback}><Dashboard /></Suspense></ClientOnly>
  },
})
