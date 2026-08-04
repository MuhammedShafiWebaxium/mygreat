'use client'

import { Link } from '@/lib/navigation'
import { usePathname, useRouter } from '@/lib/navigation'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { BarChart3, Bell, BriefcaseBusiness, Building2, ChevronRight, Compass, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquare, Plane, Settings2, ShieldCheck, Users, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { logoutFn } from '@/features/auth/auth.functions'
import type { UserRole } from '@/features/auth/auth.schema'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export const STAFF_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PARTNER_ADMIN: 'Partner Admin',
  MARKETING_EXECUTIVE: 'Marketing Executive',
  FINANCE_EXECUTIVE: 'Finance Executive',
  SUPPORT_EXECUTIVE: 'Support Executive',
  ADMISSIONS_EXECUTIVE: 'Admissions Executive',
  VISA_EXECUTIVE: 'Visa Executive',
  RECEPTION_EXECUTIVE: 'Reception Executive',
  STUDENT: 'Student',
}

const pageMeta = {
  '/staff': { title: 'Operations overview', description: 'Monitor student progress and focus the team on what matters next.' },
  '/staff/students': { title: 'Student management', description: 'View student profiles and manage partner assignments.' },
  '/staff/applications': { title: 'Applications dashboard', description: 'Create, track, and update university applications.' },
  '/staff/visas': { title: 'Visa dashboard', description: 'Track visa preparation, filing, and decisions.' },
  '/staff/team': { title: 'Team management', description: 'Manage staff access, roles, and operational coverage.' },
  '/staff/partners': { title: 'Partner reviews', description: 'Review and approve study abroad partner registrations.' },
  '/staff/universities': { title: 'University management', description: 'Manage countries, universities, courses, and effective-dated fees.' },
  '/staff/messages': { title: 'Support messages', description: 'Assist students and prioritize subscribed support requests.' },
  '/staff/notifications': { title: 'Notifications', description: 'Review operational and student support alerts.' },
  '/staff/finance': { title: 'Finance management', description: 'Manage subscription pricing, payments, and revenue.' },
  '/staff/settings': { title: 'Platform settings', description: 'Configure Mygreat Pro and platform-wide preferences.' },
}

export default function Staff({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const pathname = usePathname() ?? '/staff'
  const theme = useAppStore((state) => state.theme)
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const [mobileOpen, setMobileOpen] = useState(false)
  const meta = pageMeta[pathname as keyof typeof pageMeta]
    ?? (pathname.startsWith('/staff/students/') ? pageMeta['/staff/students']
      : pathname.startsWith('/staff/partners/') ? pageMeta['/staff/partners']
        : pathname.startsWith('/staff/applications/') ? pageMeta['/staff/applications']
          : pathname.startsWith('/staff/visas/') ? pageMeta['/staff/visas']
        : pageMeta['/staff'])
  const logout = useMutation({
    mutationFn: () => logoutFn(),
    onSuccess: async () => {
      queryClient.clear()
      router.replace(user?.accountType === 'ADMIN' ? '/login/admin' : '/login/partner')
    },
  })

  const navigationGroups = [
    {
      label: 'Overview',
      items: [{ to: '/staff' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true }],
    },
    {
      label: 'Student operations',
      items: [
        { to: '/staff/students' as const, label: 'Students', icon: BriefcaseBusiness },
        { to: '/staff/applications' as const, label: 'Applications', icon: FileText },
        { to: '/staff/visas' as const, label: 'Visas', icon: Plane },
      ],
    },
    {
      label: 'Catalog & partners',
      items: [
        ...(user?.role === 'SUPER_ADMIN' ? [{ to: '/staff/universities' as const, label: 'Universities', icon: GraduationCap }] : []),
        ...(user?.accountType === 'ADMIN' ? [{ to: '/staff/partners' as const, label: user.role === 'SUPER_ADMIN' ? 'Partner reviews' : 'Partners', icon: Building2 }] : []),
      ],
    },
    {
      label: 'Communication',
      items: [
        ...(['SUPER_ADMIN', 'SUPPORT_EXECUTIVE'].includes(user?.role ?? '') ? [{ to: '/staff/messages' as const, label: 'Messages', icon: MessageSquare }] : []),
        ...(['SUPER_ADMIN', 'SUPPORT_EXECUTIVE'].includes(user?.role ?? '') ? [{ to: '/staff/notifications' as const, label: 'Notifications', icon: Bell }] : []),
      ],
    },
    {
      label: 'Administration',
      items: [
        ...(user?.role === 'SUPER_ADMIN' ? [{ to: '/staff/finance' as const, label: 'Finance', icon: WalletCards }] : []),
        ...(['SUPER_ADMIN', 'PARTNER_ADMIN'].includes(user?.role ?? '') ? [{ to: '/staff/team' as const, label: 'Team management', icon: Users }] : []),
        ...(user?.role === 'SUPER_ADMIN' ? [{ to: '/staff/settings' as const, label: 'Settings', icon: Settings2 }] : []),
      ],
    },
  ].filter((group) => group.items.length > 0)

  const sidebar = (
    <>
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Mygreat home">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20"><Compass className="size-5 text-[#10172a]" /></span>
          <span><span className="block font-display text-xl font-semibold leading-none">Mygreat</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.23em] text-white/35">Operations</span></span>
        </Link>
        <button onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl border border-white/10 lg:hidden"><X className="size-4" /></button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 text-xs font-bold text-indigo-200">{user?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="mt-0.5 truncate text-[10.5px] text-white/35">{user ? STAFF_ROLE_LABELS[user.role] : ''}</p></div></div>
      </div>

      <nav className="mt-7 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 scrollbar-thin">
        {navigationGroups.map((group) => <div key={group.label}>
          <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">{group.label}</p>
          <div className="space-y-1">{group.items.map((item) => {
            const active = 'exact' in item && item.exact ? pathname === item.to : pathname.startsWith(item.to)
            return <Link key={item.to} href={item.to} onClick={() => setMobileOpen(false)} className={cn('staff-nav-item group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition', active ? 'staff-nav-active bg-white/[0.075] text-white ring-1 ring-white/[0.08]' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80')}><item.icon className={cn('size-[17px]', active ? 'text-amber-300' : 'text-white/30')} /><span className="flex-1">{item.label}</span>{active && <ChevronRight className="size-3.5 text-white/25" />}</Link>
          })}</div>
        </div>)}
      </nav>

      <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-300" /><p className="text-xs font-semibold">Secure workspace</p></div><p className="mt-2 text-[10.5px] leading-4 text-white/35">Access is role-controlled and operational activity is recorded.</p></div>
      <button onClick={() => logout.mutate()} disabled={logout.isPending} className="mt-3 flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-medium text-white/40 transition hover:bg-rose-400/[0.06] hover:text-rose-300"><LogOut className="size-4" />{logout.isPending ? 'Signing out…' : 'Sign out'}</button>
    </>
  )

  return (
    <div className={cn(theme === 'light' && 'light-theme', 'staff-workspace relative h-screen overflow-hidden bg-[#060a18] text-white')}>
      <div className="aurora -right-32 -top-40 size-[520px] bg-violet-700/10" />
      <div className="relative flex h-full">
        <aside className="staff-sidebar relative hidden h-full w-[276px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080d1d]/80 p-5 pt-6 noise lg:flex">{sidebar}</aside>
        {mobileOpen && <div className="fixed inset-0 z-[70] lg:hidden"><button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/55 backdrop-blur-sm" /><aside className="staff-sidebar absolute inset-y-0 left-0 flex w-[286px] flex-col border-r border-white/10 bg-[#080d1d] p-5 pt-6">{sidebar}</aside></div>}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="staff-header flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#070b18]/55 px-4 py-3.5 backdrop-blur-xl sm:px-7 lg:px-8 lg:py-4">
            <button onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10 lg:hidden"><Menu className="size-4.5" /></button>
            <div className="min-w-0"><div className="flex items-center gap-2"><BarChart3 className="size-3.5 text-amber-300" /><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300/75">Staff workspace</span></div><h1 className="mt-0.5 truncate font-display text-xl">{meta.title}</h1><p className="mt-0.5 hidden truncate text-[10.5px] text-white/32 sm:block">{meta.description}</p></div>
            <div className="flex-1" /><ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto scrollbar-thin"><div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 lg:px-8 lg:py-7">{children}</div></main>
        </div>
      </div>
    </div>
  )
}
