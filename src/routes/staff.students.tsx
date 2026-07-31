import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import StudentPipeline from '@/screens/staff/StudentPipeline'
export const Route = createFileRoute('/staff/students')({ component: () => <Suspense fallback={<Fallback />}><StudentPipeline /></Suspense> })
function Fallback() { return <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" /> }
