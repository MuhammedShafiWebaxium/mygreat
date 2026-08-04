import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import VisaDashboard from '@/screens/staff/VisaDashboard'

export const Route = createFileRoute('/staff/visas/')({
  component: () => <Suspense fallback={<Fallback />}><VisaDashboard /></Suspense>,
})

function Fallback() {
  return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />
}
