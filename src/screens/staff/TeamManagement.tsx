'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { BadgeCheck, Ban, CheckCircle2, Mail, Pencil, Plus, Search, ShieldCheck, UserCog, UserPlus, Users, X } from 'lucide-react'
import { createStaffFn, updateStaffFn } from '@/features/admin/admin.functions'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { staffListQuery } from '@/features/admin/admin.queries'
import { STAFF_ROLE_LABELS } from '@/screens/Staff'
import { cn } from '@/lib/utils'

type StaffRole = 'SUPER_ADMIN' | 'MARKETING_EXECUTIVE' | 'FINANCE_EXECUTIVE' | 'SUPPORT_EXECUTIVE' | 'PARTNER_ADMIN' | 'ADMISSIONS_EXECUTIVE' | 'VISA_EXECUTIVE' | 'RECEPTION_EXECUTIVE'

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'ADMISSIONS_EXECUTIVE' as StaffRole }

export default function TeamManagement() {
  const queryClient = useQueryClient()
  const { data: staff } = useSuspenseQuery(staffListQuery)
  const { data: currentUser } = useSuspenseQuery(currentUserQuery)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm] = useState({ role: 'ADMISSIONS_EXECUTIVE' as StaffRole, active: true })
  const selected = staff.find((member) => member.id === selectedId) ?? null
  const drawerOpen = createOpen || Boolean(selected)

  useEffect(() => {
    if (selected) setEditForm({ role: selected.role as StaffRole, active: selected.active })
  }, [selected])

  useEffect(() => {
    if (!drawerOpen) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [drawerOpen])

  const closeDrawer = () => { setCreateOpen(false); setSelectedId(null) }
  const refreshTeam = () => queryClient.invalidateQueries({ queryKey: ['staff', 'users'] })

  const createStaff = useMutation({
    mutationFn: () => createStaffFn({ data: createForm }),
    onSuccess: async () => {
      setCreateForm(EMPTY_CREATE)
      await refreshTeam()
      closeDrawer()
    },
  })
  const updateStaff = useMutation({
    mutationFn: () => updateStaffFn({ data: { userId: selected!.id, accountType: selected!.accountType, ...editForm } }),
    onSuccess: async () => {
      await refreshTeam()
      closeDrawer()
    },
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return !term ? staff : staff.filter((member) => [member.name, member.email, STAFF_ROLE_LABELS[member.role]].some((value) => value.toLowerCase().includes(term)))
  }, [staff, search])
  const activeCount = staff.filter((member) => member.active).length
  const admissionsCount = staff.filter((member) => member.role === 'ADMISSIONS_EXECUTIVE' && member.active).length
  const visaCount = staff.filter((member) => member.role === 'VISA_EXECUTIVE' && member.active).length
  const summaries = [
    { label: 'Total accounts', value: staff.length, icon: Users },
    { label: 'Active now', value: activeCount, icon: CheckCircle2 },
    { label: 'Admissions', value: admissionsCount, icon: BadgeCheck },
    { label: 'Visa', value: visaCount, icon: ShieldCheck },
  ]

  return (
    <div className="space-y-5">
      <section className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Team administration</p><h2 className="mt-1 font-display text-2xl">Your operations team</h2><p className="mt-2 text-xs leading-5 text-white/38">Control staff access and keep admissions and visa coverage balanced.</p></div>
          <div className="flex-1" />
          <button onClick={() => { setSelectedId(null); setCreateForm({ ...EMPTY_CREATE, role: currentUser?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMISSIONS_EXECUTIVE' }); setCreateOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-xs font-bold text-[#10172a] shadow-[0_10px_30px_-12px_rgba(245,158,11,.7)] transition hover:-translate-y-0.5"><Plus className="size-4" /> Add staff member</button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 lg:grid-cols-4">
          {summaries.map((summary) => <div key={summary.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><summary.icon className="size-4 text-amber-300" /><p className="mt-3 font-display text-2xl">{summary.value}</p><p className="mt-1 text-[10.5px] text-white/35">{summary.label}</p></div>)}
        </div>
      </section>

      <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Access directory</p><h3 className="mt-1 font-display text-xl">{filtered.length} team members</h3></div><div className="relative sm:ml-auto sm:w-72"><Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-white/28" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or role" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2.5 pl-10 pr-4 text-xs outline-none placeholder:text-white/25 focus:border-amber-300/35" /></div></div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {filtered.map((member) => (
            <article key={member.id} className={cn('rounded-2xl border p-4 transition', member.active ? 'border-white/[0.07] bg-white/[0.02] hover:border-white/15' : 'border-rose-400/10 bg-rose-400/[0.025] opacity-75')}>
              <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-violet-400/10 text-xs font-bold text-indigo-200">{member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-sm font-semibold">{member.name}</p>{member.id === currentUser?.id && <span className="rounded-full bg-amber-300/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">YOU</span>}</div><p className="mt-1 flex items-center gap-1.5 truncate text-[10.5px] text-white/35"><Mail className="size-3" />{member.email}</p></div><span className={cn('size-2 rounded-full', member.active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]' : 'bg-rose-400')} /></div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300"><ShieldCheck className="size-3" />{STAFF_ROLE_LABELS[member.role]}</span><button onClick={() => { setCreateOpen(false); setSelectedId(member.id) }} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-semibold text-white/45 transition hover:border-amber-300/25 hover:text-white"><Pencil className="size-3" /> Manage</button></div>
            </article>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Close team drawer" onClick={closeDrawer} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="staff-team-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1122] shadow-2xl">
              <header className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6"><span className="grid size-11 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.09]">{createOpen ? <UserPlus className="size-5 text-amber-300" /> : <UserCog className="size-5 text-amber-300" />}</span><div><p className="font-display text-xl">{createOpen ? 'Add staff member' : 'Manage account'}</p><p className="mt-1 text-[10.5px] text-white/35">{createOpen ? 'Create secure access for a new teammate' : selected?.email}</p></div><button onClick={closeDrawer} className="ml-auto grid size-10 place-items-center rounded-xl border border-white/10"><X className="size-4" /></button></header>

              {createOpen ? (
                <form onSubmit={(event) => { event.preventDefault(); createStaff.mutate() }} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6">
                  <div className="space-y-4"><label className="block"><span className="mb-2 block text-[11px] font-semibold text-white/55">Full name</span><input required value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-amber-300/35" /></label><label className="block"><span className="mb-2 block text-[11px] font-semibold text-white/55">Work email</span><input required type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm outline-none focus:border-amber-300/35" /></label><label className="block"><span className="mb-2 block text-[11px] font-semibold text-white/55">Temporary password</span><input required minLength={12} type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} placeholder="At least 12 characters" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-amber-300/35" /></label><RoleSelect value={createForm.role} onChange={(role) => setCreateForm({ ...createForm, role })} /></div>
                  {createStaff.error && <p className="mt-4 rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-300">{createStaff.error instanceof Error ? createStaff.error.message : 'Could not create staff account.'}</p>}
                  <div className="mt-auto flex gap-3 border-t border-white/[0.07] pt-5"><button type="button" onClick={closeDrawer} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/55">Cancel</button><button disabled={createStaff.isPending} className="flex-[1.4] rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a] disabled:opacity-50">{createStaff.isPending ? 'Creating…' : 'Create account'}</button></div>
                </form>
              ) : selected ? (
                <form onSubmit={(event) => { event.preventDefault(); updateStaff.mutate() }} className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-indigo-400/10 text-sm font-bold text-indigo-200">{selected.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div><p className="font-semibold">{selected.name}</p><p className="mt-1 text-xs text-white/35">Created {new Date(selected.createdAt).toLocaleDateString()}</p></div></div></div>
                  <div className="mt-6 space-y-5"><RoleSelect value={editForm.role} onChange={(role) => setEditForm({ ...editForm, role })} /><div><span className="mb-2 block text-[11px] font-semibold text-white/55">Account status</span><button type="button" disabled={selected.id === currentUser?.id} onClick={() => setEditForm({ ...editForm, active: !editForm.active })} className={cn('flex w-full items-center gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50', editForm.active ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : 'border-rose-400/20 bg-rose-400/[0.06]')}><span className={cn('grid size-9 place-items-center rounded-xl', editForm.active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300')}>{editForm.active ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}</span><div><p className="text-xs font-semibold">{editForm.active ? 'Active account' : 'Inactive account'}</p><p className="mt-1 text-[10px] text-white/35">{selected.id === currentUser?.id ? 'You cannot deactivate your own account' : 'Click to change account access'}</p></div></button></div></div>
                  {updateStaff.error && <p className="mt-4 rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-300">{updateStaff.error instanceof Error ? updateStaff.error.message : 'Could not update staff account.'}</p>}
                  <div className="mt-auto flex gap-3 border-t border-white/[0.07] pt-5"><button type="button" onClick={closeDrawer} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/55">Cancel</button><button disabled={updateStaff.isPending} className="flex-[1.4] rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a] disabled:opacity-50">{updateStaff.isPending ? 'Saving…' : 'Save changes'}</button></div>
                </form>
              ) : null}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RoleSelect({ value, onChange }: { value: StaffRole; onChange: (role: StaffRole) => void }) {
  const platformAdmin = ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE'].includes(value)
  return <label className="block"><span className="mb-2 block text-[11px] font-semibold text-white/55">Role and permissions</span><select value={value} onChange={(event) => onChange(event.target.value as StaffRole)} className="w-full rounded-xl border border-white/[0.08] bg-[#0a0f24] px-4 py-3 text-sm outline-none focus:border-amber-300/35">{platformAdmin ? <><option value="SUPER_ADMIN">Super Admin</option><option value="MARKETING_EXECUTIVE">Marketing Executive</option><option value="FINANCE_EXECUTIVE">Finance Executive</option><option value="SUPPORT_EXECUTIVE">Support Executive</option></> : <><option value="ADMISSIONS_EXECUTIVE">Admissions Executive</option><option value="VISA_EXECUTIVE">Visa Executive</option><option value="RECEPTION_EXECUTIVE">Reception Executive</option></>}</select><p className="mt-2 text-[10px] leading-4 text-white/30">{platformAdmin ? 'Platform administration account.' : 'Staff access is limited to this partner company.'}</p></label>
}
