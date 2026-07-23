'use client'

import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Filter, Search, SlidersHorizontal, UserRoundSearch } from 'lucide-react'
import { staffQueueQuery, staffStudentsQuery } from '@/features/admin/admin.queries'
import { cn } from '@/lib/utils'

const FILTERS = ['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER'] as const
type FilterValue = (typeof FILTERS)[number]

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function StudentPipeline() {
  const { data: queue } = useSuspenseQuery(staffQueueQuery)
  const { data: students } = useSuspenseQuery(staffStudentsQuery)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('ALL')

  type StudentRow = {
    student: (typeof students)[number]
    application: (typeof queue)[number] | null
  }

  const rows = useMemo<StudentRow[]>(() => students.flatMap<StudentRow>((student) => {
    const applications = queue.filter((item) => item.studentId === student.id)
    return applications.length ? applications.map((application) => ({ student, application })) : [{ student, application: null }]
  }), [students, queue])

  const filtered = useMemo(() => rows.filter(({ student, application }) => {
    const status = application?.status ?? 'NOT_STARTED'
    const matchesFilter = filter === 'ALL' || status === filter
    const term = search.trim().toLowerCase()
    const country = student.destinationCountry?.name ?? ''
    const matchesSearch = !term || [student.name, student.email, country, student.degree, student.field, application?.university, application?.program, application?.nextAction]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .some((value) => value.toLowerCase().includes(term))
    return matchesFilter && matchesSearch
  }), [rows, search, filter])

  const visibleStudentCount = new Set(filtered.map(({ student }) => student.id)).size

  return (
    <div className="space-y-5">
      <section className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/28" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, university, program, or destination" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-amber-300/35" /></div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">{FILTERS.map((item) => <button key={item} onClick={() => setFilter(item)} className={cn('shrink-0 rounded-xl border px-3.5 py-2.5 text-[10.5px] font-semibold transition', filter === item ? 'border-amber-300/30 bg-amber-300/[0.1] text-amber-200' : 'border-white/[0.07] text-white/38 hover:text-white/70')}>{item === 'ALL' ? 'All students' : label(item)}</button>)}</div>
        </div>
      </section>

      <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Student directory</p><h2 className="mt-1 font-display text-xl">{visibleStudentCount} {visibleStudentCount === 1 ? 'student' : 'students'} · {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}</h2></div><div className="flex items-center gap-2 text-[10.5px] text-white/35"><SlidersHorizontal className="size-3.5" /> Sorted by student</div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead><tr className="border-b border-white/[0.06] text-[9px] font-bold uppercase tracking-[0.17em] text-white/28"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Destination & intake</th><th className="px-4 py-4">University & program</th><th className="px-4 py-4">Admissions</th><th className="px-4 py-4">Visa</th><th className="px-4 py-4">Next action</th><th className="px-6 py-4">Progress</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map(({ student, application }) => (
                <tr key={application?.id ?? student.id} className="group transition hover:bg-white/[0.025]">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-indigo-400/10 text-[11px] font-bold text-indigo-200">{student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div><p className="text-[13px] font-semibold">{student.name}</p><p className="mt-0.5 text-[10px] text-white/30">{student.email}</p></div></div></td>
                  <td className="px-4 py-4"><p className="text-xs font-medium">{student.destinationCountry?.name ?? 'Not selected'}</p><p className="mt-1 text-[10.5px] text-white/35">{student.preferredIntake || 'Intake not set'}</p></td>
                  <td className="px-4 py-4">{application ? <><p className="max-w-[210px] truncate text-xs font-medium">{application.university}</p><p className="mt-1 max-w-[210px] truncate text-[10.5px] text-white/35">{application.program}</p></> : <><p className="text-xs font-medium text-white/45">No application yet</p><p className="mt-1 text-[10.5px] text-white/30">{[student.degree, student.field].filter(Boolean).join(' in ') || 'Profile created'}</p></>}</td>
                  <td className="px-4 py-4"><span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-semibold', application ? 'border-sky-400/20 bg-sky-400/[0.08] text-sky-300' : 'border-white/10 bg-white/[0.035] text-white/38')}>{label(application?.status ?? 'NOT_STARTED')}</span></td>
                  <td className="px-4 py-4"><span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-violet-300">{label(application?.visaStatus ?? 'NOT_STARTED')}</span></td>
                  <td className="px-4 py-4"><p className="max-w-[190px] text-[11px] leading-5 text-white/48">{application?.nextAction || 'Help student choose an application'}</p></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${application?.progress ?? 0}%` }} /></div><span className="text-[10.5px] font-semibold">{application?.progress ?? 0}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="py-20 text-center"><UserRoundSearch className="mx-auto size-8 text-white/25" /><h3 className="mt-4 font-display text-xl">No matching students</h3><p className="mt-2 text-xs text-white/35">Try a different status or search term.</p><button onClick={() => { setSearch(''); setFilter('ALL') }} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs"><Filter className="size-3.5" /> Clear filters</button></div>}
      </section>
    </div>
  )
}
