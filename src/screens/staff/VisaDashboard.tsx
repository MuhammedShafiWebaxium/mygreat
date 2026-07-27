'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Plane, Search } from 'lucide-react'
import { staffQueueQuery } from '@/features/admin/admin.queries'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { updateApplicationFn } from '@/features/workflow/workflow.functions'
import { STAFF_PAGE_SIZE, StaffPagination } from '@/components/staff/StaffPagination'

const VISA_STATUSES = ['NOT_STARTED', 'DOCUMENTS_PENDING', 'READY_TO_FILE', 'FILED', 'APPROVED', 'REJECTED'] as const
const title = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function VisaDashboard() {
  const { data: queue } = useSuspenseQuery(staffQueueQuery)
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const canEdit = ['SUPER_ADMIN', 'PARTNER_ADMIN', 'VISA_EXECUTIVE'].includes(user?.role ?? '')
  const update = useMutation({
    mutationFn: (data: { applicationId: string; visaStatus: string; nextAction?: string }) => updateApplicationFn({ data }),
    onSuccess: async () => { setMessage('Visa case updated.'); await queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] }) },
    onError: (error) => setMessage(error.message),
  })
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return queue.filter((item) => !term || [item.studentName, item.university, item.program, item.visaStatus].some((value) => value.toLowerCase().includes(term)))
  }, [queue, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / STAFF_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleCases = filtered.slice((currentPage - 1) * STAFF_PAGE_SIZE, currentPage * STAFF_PAGE_SIZE)

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-3">{[
      ['Visa cases', queue.length],
      ['Ready or filed', queue.filter((item) => ['READY_TO_FILE', 'FILED'].includes(item.visaStatus)).length],
      ['Approved', queue.filter((item) => item.visaStatus === 'APPROVED').length],
    ].map(([label, value]) => <div key={String(label)} className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><Plane className="size-4 text-violet-300" /><p className="mt-3 text-[10px] uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</section>

    <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search visa cases" className="w-full rounded-xl border border-white/10 bg-white/[.035] py-3 pl-11 pr-4 text-sm outline-none" /></div>{message && <p className="mt-3 text-xs text-violet-200">{message}</p>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.17em] text-white/30"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Application</th><th className="px-4 py-4">Visa status</th><th className="px-6 py-4">Case action</th></tr></thead><tbody className="divide-y divide-white/[.05]">{visibleCases.map((item) => <tr key={item.id}>
        <td className="px-6 py-4"><p className="text-xs font-semibold">{item.studentName}</p></td>
        <td className="px-4 py-4"><p className="text-xs">{item.university}</p><p className="mt-1 text-[10.5px] text-white/35">{item.program}</p></td>
        <td className="px-4 py-4">{canEdit ? <select value={item.visaStatus} onChange={(event) => update.mutate({ applicationId: item.id, visaStatus: event.target.value })} className="rounded-lg border border-violet-400/20 bg-[#0c1122] px-3 py-2 text-[10px] text-violet-300">{VISA_STATUSES.map((status) => <option key={status} value={status}>{title(status)}</option>)}</select> : <span className="text-xs text-violet-300">{title(item.visaStatus)}</span>}</td>
        <td className="px-6 py-4"><p className="max-w-md text-xs text-white/50">{item.nextAction}</p></td>
      </tr>)}</tbody></table></div>
      <StaffPagination page={currentPage} total={filtered.length} onPageChange={setPage} />
    </section>
  </div>
}
