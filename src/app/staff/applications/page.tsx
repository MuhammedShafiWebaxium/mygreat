import type { Metadata } from 'next'
import { Suspense } from 'react'
import ApplicationDashboard from '@/screens/staff/ApplicationDashboard'

export const metadata: Metadata = { title: 'Applications dashboard' }

export default function Page() {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><ApplicationDashboard /></Suspense>
}
