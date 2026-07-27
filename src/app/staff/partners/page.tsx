import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PartnerReviews from '@/screens/staff/PartnerReviews'
import { getSessionUser } from '@/features/auth/session.server'

export const metadata: Metadata = { title: 'Partner reviews' }

export default async function Page() {
  const user = await getSessionUser()
  if (user?.accountType !== 'ADMIN') redirect('/staff')
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><PartnerReviews /></Suspense>
}
