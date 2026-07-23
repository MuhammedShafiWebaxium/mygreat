import { motion } from 'framer-motion'
import {
  Check, ArrowRight, ArrowUpRight, Send, ClipboardList, FileCheck, Trophy,
  CalendarClock, Phone, MessageSquare, Sparkles, Flag, Compass,
} from 'lucide-react'
import { JOURNEY, DOCUMENTS, ADVISOR, daysUntil, fmtDate } from '@/data/dashboard'
import type { Application, Deadline, Reco, StudentProfile, Task } from '@/data/dashboard'
import { Panel, PanelTitle, StatusChip, Bar, ProgressRing, UniMark, fadeUp } from './bits'
import { cn } from '@/lib/utils'
import type { TabId } from './Sidebar'

interface Props {
  student: StudentProfile
  applications: Application[]
  recommendations: Reco[]
  deadlines: Deadline[]
  tasks: Task[]
  onToggleTask: (id: string) => void
  onNavigate: (t: TabId) => void
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Overview({ student, applications, recommendations, deadlines, tasks, onToggleTask, onNavigate }: Props) {
  const hasOffer = applications.some((a) => a.status === 'offer')
  const nextApp = applications.filter((a) => a.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!))[0]
  const nextDeadlines = [...deadlines].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const verified = DOCUMENTS.filter((d) => d.status === 'verified').length
  const openTasks = tasks.filter((t) => !t.done).length
  const offers = applications.filter((a) => a.status === 'offer').length

  const tagline = hasOffer
    ? "One offer secured, one decision pending, one application to finish. You're closer than you think."
    : applications.length > 0
      ? `${applications.length} ${applications.length === 1 ? 'application' : 'applications'} underway — steady progress beats perfect plans.`
      : 'Your shortlist is empty — let’s find the universities that fit you.'

  const stats = [
    { icon: Send, label: 'Active applications', value: String(applications.length), note: hasOffer ? `${offers} offer in hand` : 'In progress', tint: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    { icon: ClipboardList, label: 'Tasks open', value: String(openTasks), note: 'Keep the streak going', tint: 'text-sky-300 bg-sky-400/10 border-sky-400/20' },
    { icon: FileCheck, label: 'Documents verified', value: `${verified}/${DOCUMENTS.length}`, note: 'IELTS still needed', tint: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
    { icon: Trophy, label: 'Offers', value: String(offers), note: hasOffer ? 'Celebrate, then decide' : 'They’re coming', tint: 'text-violet-300 bg-violet-400/10 border-violet-400/20' },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* hero + countdown */}
      <div className="grid xl:grid-cols-3 gap-4 sm:gap-5">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="xl:col-span-2">
          <Panel className="relative overflow-hidden p-6 sm:p-7 h-full">
            <div className="aurora w-[380px] h-[380px] -top-40 -right-24 bg-amber-500/10" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/45">
                <span>{student.flag}</span>
                <span>{student.target}{student.country ? ` · ${student.country}` : ''}</span>
                <span className="text-white/20">·</span>
                <span>{student.intake} intake</span>
              </div>
              <h2 className="font-display text-3xl sm:text-[2.4rem] leading-tight font-light mt-2.5">
                {greeting()}, <span className="text-gradient-gold font-medium">{student.firstName}.</span>
              </h2>
              <p className="text-white/50 text-sm mt-2 max-w-md">{tagline}</p>

              {/* journey stepper */}
              <div className="flex items-center mt-7 max-w-lg">
                {JOURNEY.map((j, i) => {
                  const done = i < student.journeyStep
                  const current = i === student.journeyStep
                  return (
                    <div key={j} className={cn('flex items-center', i < JOURNEY.length - 1 && 'flex-1')}>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all',
                            done
                              ? 'bg-amber-400 border-amber-400 text-[#0a0f24]'
                              : current
                                ? 'border-amber-400/70 text-amber-300 shadow-[0_0_0_4px_rgba(242,179,61,0.12)]'
                                : 'border-white/15 text-white/30'
                          )}
                        >
                          {done ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : i + 1}
                        </div>
                        <span className={cn('text-[10px] font-medium whitespace-nowrap', current ? 'text-amber-200' : done ? 'text-white/60' : 'text-white/25')}>
                          {j}
                        </span>
                      </div>
                      {i < JOURNEY.length - 1 && (
                        <div className="flex-1 h-px mx-2 -mt-5 bg-white/10 relative overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 to-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: done ? '100%' : '0%' }}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* countdown */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <Panel className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 text-white/45 text-[12px] font-medium">
              <CalendarClock className="w-4 h-4 text-amber-400/80" />
              Next big deadline
            </div>
            {nextApp ? (
              <>
                <div className="flex items-center gap-5 mt-4 flex-1">
                  <ProgressRing value={nextApp.progress} size={96} stroke={8}>
                    <div className="text-center">
                      <p className="font-display text-[1.7rem] leading-none text-gradient-gold font-medium">{daysUntil(nextApp.deadline!)}</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/40 mt-1">days</p>
                    </div>
                  </ProgressRing>
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] leading-snug truncate">{nextApp.uniName}</p>
                    <p className="text-xs text-white/40 mt-1">{fmtDate(nextApp.deadline!)}</p>
                    <p className="text-xs text-amber-300/90 font-medium mt-2">{nextApp.progress}% complete</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('applications')}
                  className="group mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-[13px] rounded-xl px-4 py-3 shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)] hover:-translate-y-0.5 transition-all"
                >
                  Continue application
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-white/45" />
                </div>
                <p className="font-semibold text-[15px] mt-4">No applications yet</p>
                <p className="text-xs text-white/40 mt-1.5 max-w-[220px]">Shortlist universities to start your first application.</p>
                <button
                  onClick={() => onNavigate('universities')}
                  className="group mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-[13px] rounded-xl px-5 py-3 shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)] hover:-translate-y-0.5 transition-all"
                >
                  Find universities
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </Panel>
        </motion.div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" custom={2 + i}>
            <Panel className="p-4.5 sm:p-5 hover:border-white/20 transition-colors">
              <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', s.tint)}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="font-display text-2xl sm:text-[1.7rem] mt-3.5">{s.value}</p>
              <p className="text-[12px] text-white/55 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.note}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* applications + right rail */}
      <div className="grid xl:grid-cols-3 gap-4 sm:gap-5 items-start">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="xl:col-span-2">
          <Panel>
            <PanelTitle
              right={
                <button onClick={() => onNavigate('applications')} className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-300/90 hover:text-amber-200 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              Application tracker
            </PanelTitle>
            <div className="px-3 sm:px-4 pb-3 space-y-2">
              {applications.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onNavigate('applications')}
                  className="w-full text-left rounded-2xl p-4 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.045] hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <UniMark initials={a.initials} active={a.status === 'offer'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <p className="font-semibold text-[14.5px] truncate">{a.uniName}</p>
                        <StatusChip status={a.status} />
                      </div>
                      <p className="text-xs text-white/40 mt-1 truncate">{a.program}</p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <Bar value={a.progress} className="flex-1" />
                        <span className="text-[11px] font-semibold text-white/50">{a.progress}%</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>
              ))}
              {applications.length === 0 && (
                <button
                  onClick={() => onNavigate('universities')}
                  className="w-full rounded-2xl p-6 border border-dashed border-white/15 hover:border-amber-400/40 hover:bg-amber-400/[0.02] transition-all text-center"
                >
                  <Compass className="w-5 h-5 text-white/40 mx-auto" />
                  <p className="text-[13.5px] font-semibold mt-3">Nothing to track yet</p>
                  <p className="text-[11.5px] text-white/35 mt-1">Add universities to your shortlist first.</p>
                </button>
              )}
            </div>
          </Panel>
        </motion.div>

        {/* tasks */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={7}>
          <Panel>
            <PanelTitle right={<span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-full px-2 py-0.5">{openTasks} open</span>}>
              Up next for you
            </PanelTitle>
            <div className="px-3 sm:px-4 pb-3 space-y-1">
              {tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                      t.done ? 'bg-amber-400 border-amber-400' : 'border-white/20 hover:border-amber-400/60'
                    )}
                  >
                    {t.done && <Check className="w-3 h-3 text-[#0a0f24]" strokeWidth={3.5} />}
                  </span>
                  <span className={cn('flex-1 text-[13px] leading-snug', t.done ? 'text-white/30 line-through' : 'text-white/80')}>
                    {t.label}
                  </span>
                  {t.due && !t.done && (
                    <span className="text-[10px] font-medium text-white/35 shrink-0">{fmtDate(t.due).slice(0, 6)}</span>
                  )}
                </button>
              ))}
            </div>
          </Panel>

          {/* deadlines mini */}
          <Panel className="mt-4 sm:mt-5">
            <PanelTitle
              right={
                <button onClick={() => onNavigate('deadlines')} className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-300/90 hover:text-amber-200 transition-colors">
                  All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              Deadlines
            </PanelTitle>
            <div className="px-3 sm:px-4 pb-4 space-y-2">
              {nextDeadlines.map((d) => (
                <div key={d.id} className="flex items-center gap-3.5 rounded-xl px-2.5 py-2">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold leading-none">{daysUntil(d.date)}</span>
                    <span className="text-[8px] uppercase tracking-wide text-white/35 mt-0.5">days</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{d.label}</p>
                    <p className="text-[11px] text-white/35 truncate">{d.org} · {fmtDate(d.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* recommendations + advisor */}
      <div className="grid xl:grid-cols-3 gap-4 sm:gap-5 items-start">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8} className="xl:col-span-2">
          <Panel>
            <PanelTitle
              right={
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> Matched to your profile
                </span>
              }
            >
              Recommended for you
            </PanelTitle>
            <div className="grid sm:grid-cols-2 gap-3 px-4 sm:px-5 pb-5">
              {recommendations.map((r) => (
                <div key={r.id} className="rounded-2xl p-4 border border-white/[0.07] bg-white/[0.02] hover:border-amber-400/30 hover:bg-amber-400/[0.03] transition-all group">
                  <div className="flex items-center gap-3">
                    <UniMark initials={r.initials} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[14px] truncate">{r.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">QS #{r.rank} · {r.city}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-2 py-0.5 shrink-0">
                      {r.match}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/40 mt-3.5 pt-3 border-t border-white/[0.06]">
                    <span>{r.tuition}</span>
                    <span>Acceptance {r.acceptance}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('universities')}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold rounded-xl px-3 py-2.5 border border-white/12 text-white/70 group-hover:border-amber-400/50 group-hover:text-amber-200 transition-all"
                  >
                    <Flag className="w-3.5 h-3.5" /> Add to shortlist
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* advisor */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={9}>
          <Panel className="p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">Your counsellor</p>
            <div className="flex items-center gap-3.5 mt-4">
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center font-display text-lg text-[#0a0f24] font-semibold">
                  {ADVISOR.initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0f24]" />
              </div>
              <div>
                <p className="font-semibold text-[15px]">{ADVISOR.name}</p>
                <p className="text-[11.5px] text-white/40 mt-0.5">{ADVISOR.role}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 mt-5 flex items-center gap-2.5">
              <CalendarClock className="w-4 h-4 text-amber-300 shrink-0" />
              <p className="text-[12px] text-white/55">Next available call: <span className="text-white/85 font-medium">{ADVISOR.nextSlot}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => onNavigate('messages')}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12.5px] font-semibold bg-white/[0.05] border border-white/12 text-white/80 hover:border-white/30 hover:text-white transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12.5px] font-semibold bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)] hover:-translate-y-0.5 transition-all">
                <Phone className="w-4 h-4" /> Book a call
              </button>
            </div>
          </Panel>
        </motion.div>
      </div>
    </div>
  )
}

