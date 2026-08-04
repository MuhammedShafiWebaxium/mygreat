'use client'

import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Plane, Search } from 'lucide-react'
import { primaryApplicationQueueQuery } from '@/features/admin/admin.queries'
import { STAFF_PAGE_SIZE, StaffPagination } from '@/components/staff/StaffPagination'
import { Link } from '@/lib/navigation'

const title = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function VisaDashboard() {
  const { data: queue } = useSuspenseQuery(primaryApplicationQueueQuery)
  const visaQueue = useMemo(() => queue.filter((item) => item.status === 'MOVE_TO_VISA'), [queue])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return visaQueue.filter((item) => !term || [item.studentName, item.university, item.program, item.visaStatus??''].some((value) => value.toLowerCase().includes(term)))
  }, [visaQueue, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / STAFF_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleCases = filtered.slice((currentPage - 1) * STAFF_PAGE_SIZE, currentPage * STAFF_PAGE_SIZE)

  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-3">{[
      ['Visa cases', visaQueue.length],
      ['Ready or filed', visaQueue.filter((item) => ['VISA_SLOT_BOOKING', 'VISA_SUBMISSION'].includes(item.visaStatus??'')).length],
      ['Approved', visaQueue.filter((item) => item.visaStatus === 'VISA_GRANTED').length],
    ].map(([label, value]) => <div key={String(label)} className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><Plane className="size-4 text-violet-300" /><p className="mt-3 text-[10px] uppercase tracking-[.18em] text-white/35">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</section>

    <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
      <div className="border-b border-white/[0.06] p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search visa cases" className="w-full rounded-xl border border-white/10 bg-white/[.035] py-3 pl-11 pr-4 text-sm outline-none" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.17em] text-white/30"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Application</th><th className="px-4 py-4">Visa status</th><th className="px-6 py-4">Case action</th></tr></thead><tbody className="divide-y divide-white/[.05]">{visibleCases.map((item) => <tr key={item.id}>
        <td className="px-6 py-4"><p className="text-xs font-semibold">{item.studentName}</p><p className="mt-1 text-[9px] text-white/35">{item.applicationCount} applications</p></td>
        <td className="px-4 py-4">{item.id?<Link href={`/staff/visas/${item.id}`} className="text-xs transition hover:text-violet-300">{item.university}</Link>:<><span className="text-xs text-amber-300">Priority application not selected</span><Link href={`/staff/students/${item.studentId}`} className="ml-3 text-[9px] font-bold text-amber-300 underline underline-offset-2">Select priority</Link></>}<p className="mt-1 text-[10.5px] text-white/35">{item.id?(item.visaAttemptCount?`${item.visaAttemptCount} visa attempt${item.visaAttemptCount>1?'s':''}`:'Visa not started'):item.program}</p></td>
        <td className="px-4 py-4"><span className="text-xs text-violet-300">{item.id?title(item.visaStatus??'Not started'):'Not selected'}</span></td>
        <td className="px-6 py-4"><p className="max-w-md text-xs text-white/50">{item.nextAction}</p></td>
      </tr>)}</tbody></table></div>
      <StaffPagination page={currentPage} total={filtered.length} onPageChange={setPage} />
    </section>
  </div>
}
