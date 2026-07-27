'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { FilePlus2, Plus, Search, X } from 'lucide-react'
import { assignmentOptionsQuery, primaryApplicationQueueQuery, staffStudentsQuery } from '@/features/admin/admin.queries'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { staffCreateApplicationFn, updateApplicationFn } from '@/features/workflow/workflow.functions'
import { STAFF_PAGE_SIZE, StaffPagination } from '@/components/staff/StaffPagination'

const STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const
const title = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ApplicationDashboard() {
  const { data: queue } = useSuspenseQuery(primaryApplicationQueueQuery)
  const { data: students } = useSuspenseQuery(staffStudentsQuery)
  const { data: options } = useSuspenseQuery(assignmentOptionsQuery)
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draft, setDraft] = useState({ studentId: '', universityId: '', program: '' })
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['staff', 'primary-applications'] }),
      queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] }),
    ])
  }
  const create = useMutation({
    mutationFn: () => staffCreateApplicationFn({ data: draft }),
    onSuccess: async () => {
      setDraft({ studentId: '', universityId: '', program: '' })
      setMessage('Application created.')
      setDrawerOpen(false)
      await refresh()
    },
  })
  const update = useMutation({
    mutationFn: (data: { applicationId: string; status?: string; progress?: number; nextAction?: string }) => updateApplicationFn({ data }),
    onSuccess: async () => { setMessage('Application updated.'); await refresh() },
    onError: (error) => setMessage(error.message),
  })
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return queue.filter((item) => !term || [item.studentName, item.university, item.program, item.status].some((value) => value.toLowerCase().includes(term)))
  }, [queue, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / STAFF_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleApplications = filtered.slice((currentPage - 1) * STAFF_PAGE_SIZE, currentPage * STAFF_PAGE_SIZE)
  const canEdit = ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE'].includes(user?.role ?? '')

  return <div className="space-y-5">
    {canEdit && <div className="flex justify-end"><button onClick={() => { setMessage(''); setDrawerOpen(true) }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-xs font-bold text-[#10172a] shadow-[0_10px_28px_-14px_rgba(245,158,11,.8)] transition hover:-translate-y-0.5"><Plus className="size-4" />Create application</button></div>}

    <section className="grid gap-3 sm:grid-cols-3">{[
      ['Students with applications', queue.length],
      ['Under review', queue.filter((item) => item.status === 'UNDER_REVIEW').length],
      ['Offers', queue.filter((item) => item.status === 'OFFER').length],
    ].map(([label, value]) => <div key={String(label)} className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[10px] uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</section>

    <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search applications" className="w-full rounded-xl border border-white/10 bg-white/[.035] py-3 pl-11 pr-4 text-sm outline-none" /></div>{message && <p className="mt-3 text-xs text-amber-200">{message}</p>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.17em] text-white/30"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Primary application</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Progress</th><th className="px-6 py-4">Next action</th></tr></thead><tbody className="divide-y divide-white/[.05]">{visibleApplications.map((application) => <tr key={application.studentId}>
        <td className="px-6 py-4"><p className="text-xs font-semibold">{application.studentName}</p><span className="mt-1 inline-flex rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2 py-0.5 text-[9px] font-semibold text-amber-300">Primary case</span></td>
        <td className="px-4 py-4"><p className="text-xs">{application.university}</p><p className="mt-1 text-[10.5px] text-white/35">{application.program}</p></td>
        <td className="px-4 py-4">{canEdit ? <select value={application.status} onChange={(event) => update.mutate({ applicationId: application.id, status: event.target.value })} className="rounded-lg border border-sky-400/20 bg-[#0c1122] px-2 py-2 text-[10px] text-sky-300">{STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</select> : <span className="text-xs text-sky-300">{title(application.status)}</span>}</td>
        <td className="px-4 py-4"><div className="flex items-center gap-2">{canEdit ? <input type="number" min="0" max="100" defaultValue={application.progress} onBlur={(event) => update.mutate({ applicationId: application.id, progress: Number(event.target.value) })} className="w-16 rounded-lg border border-white/10 bg-white/[.035] px-2 py-2 text-xs" /> : <span className="text-xs">{application.progress}%</span>}<div className="h-1.5 w-20 rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${application.progress}%` }} /></div></div></td>
        <td className="px-6 py-4">{canEdit ? <input defaultValue={application.nextAction} onBlur={(event) => event.target.value !== application.nextAction && update.mutate({ applicationId: application.id, nextAction: event.target.value })} className="w-full min-w-[220px] rounded-lg border border-white/10 bg-white/[.035] px-3 py-2 text-xs" /> : <span className="text-xs text-white/50">{application.nextAction}</span>}</td>
      </tr>)}</tbody></table></div>
      <StaffPagination page={currentPage} total={filtered.length} onPageChange={setPage} />
    </section>

    <AnimatePresence>
      {drawerOpen && (
        <motion.div className="fixed inset-0 z-[80] overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close create application drawer" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="staff-application-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1020] shadow-2xl">
            <header className="flex items-start gap-3 border-b border-white/[.08] p-6"><span className="grid size-10 place-items-center rounded-xl bg-amber-400/10"><FilePlus2 className="size-5 text-amber-300" /></span><div className="min-w-0 flex-1"><h2 className="font-display text-2xl">Create application</h2><p className="mt-1 text-xs leading-5 text-white/40">The first application becomes the student’s primary application.</p></div><button onClick={() => setDrawerOpen(false)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/45 transition hover:text-white"><X className="size-4" /></button></header>
            <form onSubmit={(event) => { event.preventDefault(); create.mutate() }} className="flex flex-1 flex-col overflow-y-auto p-6">
              <div className="space-y-5">
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Student</span><select value={draft.studentId} onChange={(event) => setDraft({ ...draft, studentId: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c1122] px-3 py-3 text-sm"><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">University</span><select value={draft.universityId} onChange={(event) => setDraft({ ...draft, universityId: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0c1122] px-3 py-3 text-sm"><option value="">Select university</option>{options.universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}</select></label>
                <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Program</span><input value={draft.program} onChange={(event) => setDraft({ ...draft, program: event.target.value })} placeholder="e.g. MSc Data Science" className="w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-3 text-sm outline-none" /></label>
              </div>
              {create.error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{create.error.message}</p>}
              <div className="mt-auto flex gap-3 border-t border-white/[.08] pt-5"><button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/60">Cancel</button><button disabled={!draft.studentId || !draft.universityId || draft.program.trim().length < 2 || create.isPending} className="flex-[1.4] rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a] disabled:opacity-40">{create.isPending ? 'Creating…' : 'Create application'}</button></div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
}
