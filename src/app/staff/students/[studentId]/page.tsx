import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, FileText, GraduationCap, Mail, Phone, ShieldCheck } from 'lucide-react'
import { getSessionUser } from '@/features/auth/session.server'
import { readStudentProfileForStaff } from '@/features/admin/admin.server'
import type { Country } from '@/types'
import { DesiredUniversities } from '@/components/staff/DesiredUniversities'

export const metadata = { title: 'Student profile' }

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await getSessionUser()
  if (!user || user.accountType === 'STUDENT') redirect('/login')
  const { studentId } = await params
  const student = await readStudentProfileForStaff(user, studentId).catch((error) => {
    if (error instanceof Error && error.message === 'Student not found.') return null
    throw error
  })
  if (!student) notFound()
  const country = student.profile?.destinationCountry as Country | null

  return <div className="space-y-5">
    <Link href="/staff/students" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-amber-300"><ArrowLeft className="size-4" />Back to students</Link>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-16 place-items-center rounded-2xl bg-indigo-400/10 font-display text-xl text-indigo-200">{student.name.split(/\s+/).map((part) => part[0]).slice(0,2).join('')}</span><div className="flex-1"><h2 className="font-display text-3xl">{student.name}</h2><div className="mt-2 flex flex-wrap gap-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><Mail className="size-3.5" />{student.email}</span><span className="flex items-center gap-1.5"><Phone className="size-3.5" />{student.phone || 'Not provided'}</span></div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">{student.active ? 'Active student' : 'Inactive'}</span></div></section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><GraduationCap className="size-4 text-amber-300" /><h3 className="font-display text-xl">Academic profile</h3></div><dl className="mt-5 grid grid-cols-2 gap-5 text-xs">{[
        ['Destination', country?.name || 'Not selected'], ['Education', student.profile?.educationLevel || 'Not provided'],
        ['Degree', student.profile?.degree || 'Not provided'], ['Field', student.profile?.field || 'Not provided'],
        ['GPA', student.profile?.gpa ? String(student.profile.gpa) : 'Not provided'], ['Graduation year', student.profile?.graduationYear || 'Not provided'],
        ['English test', student.profile?.englishTest || 'Not provided'], ['Preferred intake', student.profile?.preferredIntake || 'Not provided'],
      ].map(([label, value]) => <div key={label}><dt className="text-[9px] uppercase tracking-[.15em] text-white/30">{label}</dt><dd className="mt-1.5 text-white/75">{value}</dd></div>)}</dl></div>
      <DesiredUniversities studentId={student.id} universities={student.shortlist.map(({ university }) => university)} appliedUniversityIds={[...new Set(student.applications.map((application) => application.universityId))]} />
    </section>

    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><FileText className="size-4 text-violet-300" /><h3 className="font-display text-xl">Applications</h3></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{student.applications.map((application, index) => <div key={application.id} className="rounded-2xl border border-white/[.07] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{application.university.name}</p>{index === 0 && <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-bold text-amber-300">PRIMARY</span>}</div><p className="mt-1 text-xs text-white/40">{application.program}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px]"><span className="rounded-full bg-sky-400/10 px-2 py-1 text-sky-300">{application.status.replaceAll('_',' ')}</span><span className="rounded-full bg-violet-400/10 px-2 py-1 text-violet-300">Visa: {application.visaStatus.replaceAll('_',' ')}</span><span className="rounded-full bg-white/[.05] px-2 py-1 text-white/50">{application.progress}%</span></div></div>)}{!student.applications.length && <p className="text-xs text-white/35">No applications created.</p>}</div></section>

    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" /><h3 className="font-display text-xl">Documents</h3></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{student.documents.map((document) => <div key={document.id} className="rounded-xl border border-white/[.06] p-3"><p className="text-xs font-semibold">{document.name}</p><p className="mt-1 text-[10px] text-white/35">{document.status} · {document.note || 'No note'}</p></div>)}{!student.documents.length && <p className="text-xs text-white/35">No documents uploaded.</p>}</div></section>
  </div>
}
