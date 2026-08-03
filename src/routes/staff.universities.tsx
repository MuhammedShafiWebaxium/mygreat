import { Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import UniversityManagement from '@/screens/staff/UniversityManagement'
export const Route = createFileRoute('/staff/universities')({
  beforeLoad: ({ context }) => { if (context.user.role !== 'SUPER_ADMIN') throw redirect({ to: '/staff' }) },
  component: () => <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />}><UniversityManagement /></Suspense>,
})
