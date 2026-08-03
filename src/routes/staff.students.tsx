import { Suspense } from 'react'
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import StudentPipeline from '@/screens/staff/StudentPipeline'
export const Route = createFileRoute('/staff/students')({ component: StudentsRoute })

function StudentsRoute() {
  const pathname = useLocation({ select: location => location.pathname })
  if (pathname !== '/staff/students' && pathname !== '/staff/students/') return <Outlet />
  return <Suspense fallback={<Fallback />}><StudentPipeline /></Suspense>
}

function Fallback() { return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" /> }
