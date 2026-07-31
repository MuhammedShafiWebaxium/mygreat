import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, FileText, GraduationCap, Mail, Phone } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { getStudentDetailFn } from '@/features/admin/detail.functions'
import { DesiredUniversities } from '@/components/staff/DesiredUniversities'
import type { Country } from '@/types'

export const Route = createFileRoute('/staff/students/$studentId')({
  loader: ({ params }) => getStudentDetailFn({ data: params.studentId }),
  component: StudentDetail,
})

function StudentDetail() {
  const student = Route.useLoaderData()
  const country = student.profile?.destinationCountry as Country | null
  return <div className="space-y-5">
    <Link href="/staff/students" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-amber-300"><ArrowLeft className="size-4" />Back to students</Link>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6">
      <h2 className="font-display text-3xl">{student.name}</h2>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><Mail className="size-3.5" />{student.email}</span><span className="flex items-center gap-1.5"><Phone className="size-3.5" />{student.phone || 'Not provided'}</span></div>
    </section>
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><GraduationCap className="size-4 text-amber-300" /><h3 className="font-display text-xl">Academic profile</h3></div><dl className="mt-5 grid grid-cols-2 gap-5 text-xs">{[
        ['Destination', country?.name || 'Not selected'], ['Education', student.profile?.educationLevel || 'Not provided'], ['Degree', student.profile?.degree || 'Not provided'], ['Field', student.profile?.field || 'Not provided'], ['GPA', student.profile?.gpa ? String(student.profile.gpa) : 'Not provided'], ['Intake', student.profile?.preferredIntake || 'Not provided'],
      ].map(([label, value]) => <div key={label}><dt className="text-[9px] uppercase tracking-[.15em] text-white/30">{label}</dt><dd className="mt-1.5 text-white/75">{value}</dd></div>)}</dl></div>
      <DesiredUniversities studentId={student.id} universities={student.shortlist.map(({ university }) => university)} appliedUniversityIds={[...new Set(student.applications.map((application) => application.universityId))]} />
    </section>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><FileText className="size-4 text-violet-300" /><h3 className="font-display text-xl">Applications</h3></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{student.applications.map((application) => <div key={application.id} className="rounded-2xl border border-white/[.07] p-4"><p className="text-sm font-semibold">{application.university.name}</p><p className="mt-1 text-xs text-white/40">{application.program}</p><p className="mt-3 text-[10px] text-sky-300">{application.status.replaceAll('_', ' ')} · {application.progress}%</p></div>)}</div></section>
  </div>
}
