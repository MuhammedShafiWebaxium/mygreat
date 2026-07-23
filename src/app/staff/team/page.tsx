import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import TeamManagement from '@/screens/staff/TeamManagement'
import { getSessionUser } from '@/features/auth/session.server'

export const metadata: Metadata = { title: 'Team management' }

export default async function Page() {
  const user = await getSessionUser()
  if (user?.role !== 'SUPER_ADMIN') redirect('/staff')
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><TeamManagement /></Suspense>
}
