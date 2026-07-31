import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import StaffOverview from '@/screens/staff/StaffOverview'
export const Route = createFileRoute('/staff/')({ component: () => <Suspense fallback={<Fallback />}><StaffOverview /></Suspense> })
function Fallback() { return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" /> }
