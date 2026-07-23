'use client'

import Link from 'next/link'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Clock3, FileSearch, GraduationCap, Plane, Sparkles, TrendingUp, Users } from 'lucide-react'
import { staffQueueQuery } from '@/features/admin/admin.queries'
import { cn } from '@/lib/utils'

function statusLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function StaffOverview() {
  const { data: queue } = useSuspenseQuery(staffQueueQuery)
  const uniqueStudents = new Set(queue.map((item) => item.studentId)).size
  const underReview = queue.filter((item) => item.status === 'UNDER_REVIEW').length
  const offers = queue.filter((item) => item.status === 'OFFER').length
  const visaActive = queue.filter((item) => !['NOT_STARTED', 'APPROVED'].includes(item.visaStatus)).length
  const averageProgress = queue.length ? Math.round(queue.reduce((total, item) => total + item.progress, 0) / queue.length) : 0
  const priority = [...queue].sort((a, b) => a.progress - b.progress).slice(0, 5)

  const stats = [
    { label: 'Active students', value: uniqueStudents, note: `${queue.length} total applications`, icon: Users, tone: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20' },
    { label: 'Under review', value: underReview, note: 'Awaiting decisions', icon: FileSearch, tone: 'text-sky-300 bg-sky-400/10 border-sky-400/20' },
    { label: 'Offers received', value: offers, note: 'Positive outcomes', icon: GraduationCap, tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Visa in progress', value: visaActive, note: 'Cases being prepared', icon: Plane, tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
  ]

  return (
    <div className="space-y-5">
      <section className="staff-hero relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.12] via-white/[0.035] to-amber-400/[0.08] p-6 sm:p-8">
        <div className="aurora -right-20 -top-40 size-96 bg-amber-400/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.08] px-3 py-1.5 text-[10px] font-semibold text-amber-200"><Sparkles className="size-3" /> Today’s operations pulse</div><h2 className="mt-4 max-w-2xl font-display text-3xl font-light leading-tight sm:text-4xl">Keep every student moving <span className="text-gradient-gold font-medium">toward an offer.</span></h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">Your team has {queue.length} active {queue.length === 1 ? 'case' : 'cases'}. Prioritize stalled applications, unblock document reviews, and keep visa handoffs visible.</p></div>
          <div className="flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5"><div className="grid size-20 place-items-center rounded-full border-[7px] border-amber-400/25"><span className="font-display text-2xl text-amber-200">{averageProgress}%</span></div><div><p className="text-sm font-semibold">Average progress</p><p className="mt-1 max-w-[160px] text-[11px] leading-5 text-white/35">Across all applications currently in your workspace.</p></div></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <div key={stat.label} className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><div className={cn('grid size-10 place-items-center rounded-xl border', stat.tone)}><stat.icon className="size-4.5" /></div><p className="mt-4 font-display text-3xl">{stat.value}</p><p className="mt-1 text-xs font-semibold text-white/65">{stat.label}</p><p className="mt-1 text-[10.5px] text-white/30">{stat.note}</p></div>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_.75fr]">
        <div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Priority queue</p><h3 className="mt-1 font-display text-xl">Cases needing attention</h3></div><Link href="/staff/students" className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">View pipeline <ArrowRight className="size-3.5" /></Link></div>
          <div className="divide-y divide-white/[0.055] px-3 pb-3 sm:px-4">
            {priority.map((item) => <Link key={item.id} href="/staff/students" className="group grid gap-3 rounded-xl px-3 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[1.1fr_1.2fr_.8fr_auto] sm:items-center"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-400/10 text-xs font-bold text-indigo-200">{item.studentName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.studentName}</p><p className="mt-0.5 truncate text-[10.5px] text-white/32">{item.program}</p></div></div><p className="truncate text-xs text-white/55">{item.university}</p><span className="w-fit rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-sky-300">{statusLabel(item.status)}</span><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${item.progress}%` }} /></div><span className="w-8 text-right text-[10px] text-white/35">{item.progress}%</span></div></Link>)}
            {!priority.length && <div className="py-14 text-center"><CheckCircle2 className="mx-auto size-7 text-emerald-300" /><p className="mt-3 text-sm font-semibold">The queue is clear</p><p className="mt-1 text-xs text-white/35">New student cases will appear here.</p></div>}
          </div>
        </div>

        <div className="space-y-5"><div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6"><div className="flex items-center gap-2"><TrendingUp className="size-4 text-emerald-300" /><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Pipeline health</p></div><div className="mt-6 space-y-5">{[['Applications moving', queue.filter((i) => i.progress >= 50).length, queue.length], ['Offers secured', offers, queue.length], ['Visa active', visaActive, queue.length]].map(([label, value, total]) => { const pct = Number(total) ? Math.round(Number(value) / Number(total) * 100) : 0; return <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="text-white/48">{label}</span><span className="font-semibold">{pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-amber-400" style={{ width: `${pct}%` }} /></div></div>})}</div></div><div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6"><Clock3 className="size-5 text-amber-300" /><h3 className="mt-4 font-display text-xl">Daily focus</h3><p className="mt-2 text-xs leading-6 text-white/38">Review the lowest-progress cases first, then follow up on applications waiting for student documents.</p><Link href="/staff/students" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a]">Start reviewing <ArrowRight className="size-3.5" /></Link></div></div>
      </section>
    </div>
  )
}
