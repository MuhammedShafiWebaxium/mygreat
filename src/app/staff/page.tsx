import { Suspense } from 'react'
import StaffOverview from '@/screens/staff/StaffOverview'

export default function Page() {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><StaffOverview /></Suspense>
}
