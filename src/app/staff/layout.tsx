import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Staff from '@/screens/Staff'
import { getSessionUser } from '@/features/auth/session.server'
import { ClientOnly } from '@/components/ClientOnly'

export const metadata: Metadata = { title: 'Staff workspace', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.accountType === 'STUDENT') redirect('/dashboard')
  const fallback = <div className="min-h-screen bg-[#060a18]" />
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <Staff>{children}</Staff>
      </Suspense>
    </ClientOnly>
  )
}
