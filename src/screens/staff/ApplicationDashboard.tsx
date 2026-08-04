'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronsUpDown, FilePlus2, Plus, Search, X } from 'lucide-react'
import { assignmentOptionsQuery, primaryApplicationQueueQuery, staffStudentsQuery } from '@/features/admin/admin.queries'
import { Link } from '@/lib/navigation'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { staffCreateApplicationFn } from '@/features/workflow/workflow.functions'
import { STAFF_PAGE_SIZE, StaffPagination } from '@/components/staff/StaffPagination'
import { getUniversityProgramsFn } from '@/features/admin/admin.functions'
import { cn } from '@/lib/utils'

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
  const [openSelect, setOpenSelect] = useState<'university' | 'program' | null>(null)
  const [draft, setDraft] = useState({ studentId: '', universityId: '', program: '' })
  const { data: programs = [], isFetching: programsLoading } = useQuery({
    queryKey: ['staff', 'university-programs', draft.universityId],
    queryFn: () => getUniversityProgramsFn(draft.universityId),
    enabled: Boolean(draft.universityId),
  })
  const refresh = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] }),queryClient.invalidateQueries({ queryKey: ['staff', 'primary-applications'] })])
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
      ['Under review', queue.filter((item) => item.status === 'APPLICATION_FOLLOW_UP').length],
      ['Offers', queue.filter((item) => ['CONDITIONAL_OFFER_RECEIVED','MOVE_TO_VISA'].includes(item.status)).length],
    ].map(([label, value]) => <div key={String(label)} className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[10px] uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</section>

    <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search applications" className="w-full rounded-xl border border-white/10 bg-white/[.035] py-3 pl-11 pr-4 text-sm outline-none" /></div>{message && <p className="mt-3 text-xs text-amber-200">{message}</p>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.17em] text-white/30"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Application</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Progress</th><th className="px-6 py-4">Next action</th></tr></thead><tbody className="divide-y divide-white/[.05]">{visibleApplications.map((application) => <tr key={application.id}>
        <td className="px-6 py-4"><p className="text-xs font-semibold">{application.studentName}</p><span className="mt-1 text-[9px] text-white/35">{application.applicationCount} applications</span></td>
        <td className="px-4 py-4">{application.id?<Link href={`/staff/applications/${application.id}`} className="text-xs transition hover:text-amber-300">{application.university}</Link>:<><span className="text-xs text-amber-300">Priority application not selected</span><Link href={`/staff/students/${application.studentId}`} className="ml-3 text-[9px] font-bold text-amber-300 underline underline-offset-2">Select priority</Link></>}<p className="mt-1 text-[10.5px] text-white/35">{application.program}</p></td>
        <td className="px-4 py-4"><span className="text-xs text-sky-300">{application.id?title(application.status):'Not selected'}</span></td>
        <td className="px-4 py-4"><div className="flex items-center gap-2"><span className="text-xs">{application.id?`${application.progress}%`:'—'}</span><div className="h-1.5 w-20 rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${application.id?application.progress:0}%` }} /></div></div></td>
        <td className="px-6 py-4"><span className="text-xs text-white/50">{application.nextAction}</span>{application.id&&<Link href={`/staff/applications/${application.id}`} className="ml-3 text-[9px] font-bold text-amber-300">Open case →</Link>}</td>
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
                <SearchableSelect label="University" placeholder="Search and select university" value={draft.universityId} options={options.universities.map((university) => ({ value: university.id, label: university.name, detail: university.city }))} onChange={(universityId) => setDraft({ ...draft, universityId, program: '' })} open={openSelect === 'university'} onOpenChange={(open) => setOpenSelect(open ? 'university' : null)} />
                <SearchableSelect label="Program" placeholder={!draft.universityId ? 'Select a university first' : programsLoading ? 'Loading programs…' : 'Search and select program'} value={draft.program} options={programs.map((program) => ({ value: program.name, label: program.name, detail: program.level }))} onChange={(program) => setDraft({ ...draft, program })} disabled={!draft.universityId || programsLoading} emptyMessage="No active programs found for this university." open={openSelect === 'program'} onOpenChange={(open) => setOpenSelect(open ? 'program' : null)} />
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

function SearchableSelect({ label, placeholder, value, options, onChange, open, onOpenChange, disabled = false, emptyMessage = 'No results found.' }: { label: string; placeholder: string; value: string; options: Array<{ value: string; label: string; detail?: string | null }>; onChange: (value: string) => void; open: boolean; onOpenChange: (open: boolean) => void; disabled?: boolean; emptyMessage?: string }) {
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => { const term = query.trim().toLowerCase(); return options.filter((option) => !term || `${option.label} ${option.detail ?? ''}`.toLowerCase().includes(term)).slice(0, 100) }, [options, query])
  return <div className="staff-searchable-select relative"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">{label}</span><button type="button" disabled={disabled} aria-expanded={open} onClick={() => { onOpenChange(!open); setQuery('') }} className="staff-searchable-trigger flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#0c1122] px-3 py-3 text-left text-sm outline-none transition hover:border-amber-400/30 disabled:cursor-not-allowed disabled:opacity-45"><span className={cn('min-w-0 flex-1 truncate', !selected && 'text-white/35')}>{selected?.label ?? placeholder}</span><ChevronsUpDown className="size-4 shrink-0 text-white/35" /></button>{open && !disabled && <div className="staff-searchable-menu absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl"><div className="staff-searchable-search relative border-b border-white/[.07] p-2"><Search className="absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-white/30"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}…`} className="w-full rounded-xl border border-white/10 bg-white/[.04] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-amber-400/40" /></div><div className="scrollbar-thin max-h-64 overflow-y-auto p-2">{filtered.length ? filtered.map((option) => <button type="button" key={option.value} onClick={() => { onChange(option.value); onOpenChange(false); setQuery('') }} className={cn('staff-searchable-option flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[.05]', value === option.value && 'staff-searchable-option-selected bg-amber-400/[.08]')}><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{option.label}</span>{option.detail && <span className="mt-0.5 block truncate text-[9px] text-white/35">{option.detail}</span>}</span>{value === option.value && <Check className="size-3.5 text-amber-300" />}</button>) : <p className="px-3 py-8 text-center text-xs text-white/35">{emptyMessage}</p>}</div></div>}</div>
}
