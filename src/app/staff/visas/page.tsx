import type { Metadata } from 'next'
import { Suspense } from 'react'
import VisaDashboard from '@/screens/staff/VisaDashboard'

export const metadata: Metadata = { title: 'Visa dashboard' }

export default function Page() {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><VisaDashboard /></Suspense>
}
