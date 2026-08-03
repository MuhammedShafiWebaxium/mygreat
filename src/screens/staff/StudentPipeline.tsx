'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Search, UserRoundSearch } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { assignmentOptionsQuery, staffStudentsQuery } from '@/features/admin/admin.queries'
import { assignStudentFn } from '@/features/admin/admin.functions'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { STAFF_PAGE_SIZE, StaffPagination } from '@/components/staff/StaffPagination'

export default function StudentPipeline() {
  const { data: students } = useSuspenseQuery(staffStudentsQuery)
  const { data: options } = useSuspenseQuery(assignmentOptionsQuery)
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const assign = useMutation({
    mutationFn: (data: { studentId: string; partnerCompanyId: string | null }) => assignStudentFn({ data }),
    onSuccess: async () => {
      setMessage('Student assignment updated.')
      await queryClient.invalidateQueries({ queryKey: ['staff', 'students'] })
    },
    onError: (error) => setMessage(error.message),
  })
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return students.filter((student) => !term || [
      student.name, student.email, student.phone, student.destinationCountry?.name,
      student.degree, student.field, student.preferredIntake,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)))
  }, [students, search])
  const pageCount = Math.max(1, Math.ceil(filtered.length / STAFF_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleStudents = filtered.slice((currentPage - 1) * STAFF_PAGE_SIZE, currentPage * STAFF_PAGE_SIZE)
  const table = useReactTable({
    data: visibleStudents,
    columns: [{ id: 'student', accessorFn: (student) => student.id }],
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-5">
      <section className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
        <div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/28" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by student, email, destination, or course" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-amber-300/35" /></div>
        {message && <p className="mt-3 text-xs text-amber-200">{message}</p>}
      </section>

      <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
        <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Student directory</p><h2 className="mt-1 font-display text-xl">{filtered.length} {filtered.length === 1 ? 'student' : 'students'}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead><tr className="border-b border-white/[0.06] text-[9px] font-bold uppercase tracking-[0.17em] text-white/28"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Contact</th><th className="px-4 py-4">Study goal</th><th className="px-4 py-4">Intake</th><th className="px-6 py-4">Partner assignment</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {table.getRowModel().rows.map((row) => {
                const student = row.original
                return <tr key={student.id} className="transition hover:bg-white/[0.025]">
                <td className="px-6 py-4"><Link href={`/staff/students/${student.id}`} aria-label={`View ${student.name}'s profile`} className="group flex w-fit items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"><span className="grid size-9 place-items-center rounded-xl bg-indigo-400/10 text-[11px] font-bold text-indigo-200 transition group-hover:bg-amber-400/15 group-hover:text-amber-300">{student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div><span className="text-[13px] font-semibold transition group-hover:text-amber-300">{student.name}</span><p className="mt-0.5 text-[10px] text-white/30">Joined {new Date(student.createdAt).toLocaleDateString()}</p></div></Link></td>
                <td className="px-4 py-4"><p className="text-xs">{student.email}</p><p className="mt-1 text-[10.5px] text-white/35">{student.phone || 'No phone provided'}</p></td>
                <td className="px-4 py-4"><p className="text-xs">{[student.degree, student.field].filter(Boolean).join(' in ') || 'Profile incomplete'}</p><p className="mt-1 text-[10.5px] text-white/35">{student.destinationCountry?.name || 'Destination not selected'}</p></td>
                <td className="px-4 py-4 text-xs text-white/60">{student.preferredIntake || 'Not selected'}</td>
                <td className="px-6 py-4">{user?.role === 'SUPER_ADMIN' ? <select value={student.assignedPartnerCompanyId ?? ''} disabled={assign.isPending} onChange={(event) => assign.mutate({ studentId: student.id, partnerCompanyId: event.target.value || null })} className="max-w-[220px] rounded-lg border border-white/10 bg-[#0c1122] px-3 py-2 text-[10.5px]"><option value="">Unassigned</option>{options.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select> : <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Assigned to Mygreat</span>}</td>
              </tr>})}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="py-20 text-center"><UserRoundSearch className="mx-auto size-8 text-white/25" /><h3 className="mt-4 font-display text-xl">No matching students</h3><p className="mt-2 text-xs text-white/35">Try another search term.</p></div>}
        <StaffPagination page={currentPage} total={filtered.length} onPageChange={setPage} />
      </section>
    </div>
  )
}
