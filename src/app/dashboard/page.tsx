import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '@/screens/Dashboard'
import { getSessionUser } from '@/features/auth/session.server'
import { ClientOnly } from '@/components/ClientOnly'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getSessionUser()
  if (!user) redirect('/')
  if (user.accountType !== 'STUDENT') redirect('/staff')
  const fallback = <div className="min-h-screen bg-[#070b18]" />
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <Dashboard />
      </Suspense>
    </ClientOnly>
  )
}
