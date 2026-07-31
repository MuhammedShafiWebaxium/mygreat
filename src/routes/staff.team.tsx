import { Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import TeamManagement from '@/screens/staff/TeamManagement'
export const Route = createFileRoute('/staff/team')({
  beforeLoad: ({ context }) => { if (!['SUPER_ADMIN', 'PARTNER_ADMIN'].includes(context.user.role)) throw redirect({ to: '/staff' }) },
  component: () => <Suspense fallback={<Fallback />}><TeamManagement /></Suspense>,
})
function Fallback() { return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" /> }
