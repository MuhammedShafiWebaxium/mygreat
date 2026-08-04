'use client'

import { Link } from '@/lib/navigation'
import { Bell, Building2, Compass, FileText, FolderOpen, LayoutDashboard, Send, Settings, Sparkles } from 'lucide-react'
import { ProgressRing } from './bits'
import { cn } from '@/lib/utils'

export type TabId = 'overview' | 'applications' | 'universities' | 'documents' | 'notifications' | 'settings'

export const TABS: { id: TabId; label: string; icon: React.ElementType; group: 'workspace' | 'support' }[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard, group: 'workspace' },
  { id: 'universities', label: 'Discover', icon: Building2, group: 'workspace' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'workspace' },
  { id: 'applications', label: 'Applications', icon: Send, group: 'workspace' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'support' },
  { id: 'settings', label: 'Profile & settings', icon: Settings, group: 'support' },
]

interface Props {
  tab: TabId
  onChange: (t: TabId) => void
  unread: number
  profileComplete: number
}

export default function Sidebar({ tab, onChange, unread, profileComplete }: Props) {
  const renderTab = (item: (typeof TABS)[number]) => {
    const active = tab === item.id
    return (
      <button
        key={item.id}
        onClick={() => onChange(item.id)}
        className={cn(
          'dashboard-nav-item group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition-all duration-200',
          active
            ? 'dashboard-nav-active bg-white/[0.075] text-white shadow-sm ring-1 ring-white/[0.08]'
            : 'text-white/48 hover:bg-white/[0.035] hover:text-white/80',
        )}
      >
        {active && <span className="absolute -left-3.5 h-6 w-0.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.65)]" />}
        <item.icon className={cn('size-[17px] transition-colors', active ? 'text-amber-300' : 'text-white/32 group-hover:text-white/60')} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.id === 'notifications' && unread > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#0a0f24]">{unread}</span>
        )}
      </button>
    )
  }

  return (
    <aside className="dashboard-sidebar relative hidden h-full w-[276px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#080d1d]/75 px-5 pb-5 pt-6 noise lg:flex">
      <div className="aurora -left-36 -top-28 size-[320px] bg-indigo-600/20" />

      <Link href="/" className="relative z-10 flex w-fit items-center gap-3 px-1" aria-label="Mygreat home">
        <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20">
          <Compass className="size-5 text-[#0a0f24]" strokeWidth={2.5} />
        </span>
        <span>
          <span className="block font-display text-xl font-semibold leading-none">Mygreat</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">Student workspace</span>
        </span>
      </Link>

      <nav className="relative z-10 mt-8 flex-1 overflow-y-auto scrollbar-thin">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">Your journey</p>
        <div className="space-y-1">{TABS.filter((item) => item.group === 'workspace').map(renderTab)}</div>
        <p className="mb-2 mt-7 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">Account & support</p>
        <div className="space-y-1">{TABS.filter((item) => item.group === 'support').map(renderTab)}</div>
      </nav>

      <div className="dashboard-profile-card relative z-10 mt-5 rounded-2xl border border-amber-300/15 bg-gradient-to-br from-amber-300/[0.09] to-indigo-400/[0.05] p-4">
        <div className="flex items-center gap-3">
          <ProgressRing value={profileComplete} size={50} stroke={5}>
            <span className="text-[10px] font-bold text-amber-200">{profileComplete}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5"><Sparkles className="size-3 text-amber-300" /><p className="text-xs font-semibold">Profile strength</p></div>
            <p className="mt-1 text-[10.5px] leading-4 text-white/38">A stronger profile improves your university matches.</p>
          </div>
        </div>
        <button onClick={() => onChange('settings')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white/60 transition hover:border-amber-300/25 hover:text-white">
          <FileText className="size-3.5" /> Complete profile
        </button>
      </div>
    </aside>
  )
}
