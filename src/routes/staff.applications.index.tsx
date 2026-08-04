import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ApplicationDashboard from '@/screens/staff/ApplicationDashboard'

export const Route = createFileRoute('/staff/applications/')({
  component: () => <Suspense fallback={<Fallback />}><ApplicationDashboard /></Suspense>,
})

function Fallback() {
  return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />
}
