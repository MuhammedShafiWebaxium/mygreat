import { Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import PartnerReviews from '@/screens/staff/PartnerReviews'
export const Route = createFileRoute('/staff/partners')({
  beforeLoad: ({ context }) => { if (context.user.accountType !== 'ADMIN') throw redirect({ to: '/staff' }) },
  component: () => <Suspense fallback={<Fallback />}><PartnerReviews /></Suspense>,
})
function Fallback() { return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" /> }
