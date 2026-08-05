import { motion } from 'framer-motion'
import { Check, ArrowRight, Trophy, Clock, PenLine, PartyPopper, CalendarClock, ShieldCheck, Compass, Plane } from 'lucide-react'
import { daysUntil, fmtDate } from '@/data/dashboard'
import type { Application } from '@/data/dashboard'
import { Panel, StatusChip, Bar, UniMark, fadeUp } from './bits'
import { cn } from '@/lib/utils'
import type { TabId } from './Sidebar'

interface Props {
  applications: Application[]
  documentsComplete: boolean
  onNavigate: (t: TabId) => void
}

export default function Applications({ applications, documentsComplete, onNavigate }: Props) {
  const hasOffer = applications.some((a) => a.status === 'offer')

  if (!documentsComplete && applications.length===0) return <div className="max-w-5xl space-y-5"><motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}><h2 className="font-display text-2xl font-light sm:text-3xl">Application <span className="text-gradient-gold font-medium">prerequisites</span></h2></motion.div><motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}><Panel className="border-dashed p-10 text-center sm:p-14"><div className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10"><ShieldCheck className="size-6 text-amber-300"/></div><h3 className="mt-6 font-display text-2xl">Upload your required documents first</h3><p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/45">All documents configured by your admissions team must be uploaded and verified before an application can be created.</p><button onClick={()=>onNavigate('documents')} className="mt-7 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-7 py-4 text-sm font-semibold text-[#0a0f24] shadow-[0_10px_36px_-8px_rgba(242,179,11,.55)]">Upload documents <ArrowRight className="size-4"/></button></Panel></motion.div></div>

  if (applications.length === 0) {
    return (
      <div className="max-w-5xl space-y-5">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <h2 className="font-display text-2xl sm:text-3xl font-light">
            My <span className="text-gradient-gold font-medium">applications</span>
          </h2>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <Panel className="p-10 sm:p-14 text-center border-dashed">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <Compass className="w-6 h-6 text-white/45" />
            </div>
            <h3 className="font-display text-2xl mt-6">No applications yet</h3>
            <p className="text-white/45 text-sm mt-2.5 max-w-md mx-auto leading-relaxed">
              You told us you're not sure which universities to pick — no problem. Start with the matches we built from your profile.
            </p>
            <button
              onClick={() => onNavigate('universities')}
              className="group mt-7 inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-sm rounded-2xl px-7 py-4 shadow-[0_10px_36px_-8px_rgba(242,179,61,0.55)] hover:-translate-y-0.5 transition-all"
            >
              See my matches
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </button>
          </Panel>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h2 className="font-display text-2xl sm:text-3xl font-light">
          My <span className="text-gradient-gold font-medium">applications</span>
        </h2>
        <p className="text-white/45 text-sm mt-1.5">
          {applications.length} {applications.length === 1 ? 'university' : 'universities'}
        </p>
      </motion.div>

      {applications.map((a, i) => (
        <motion.div key={a.id} variants={fadeUp} initial="hidden" animate="show" custom={1 + i}>
          <Panel
            className={cn(
              'p-5 sm:p-6 relative overflow-hidden',
              a.status === 'offer' && 'border-emerald-400/25'
            )}
          >
            {a.status === 'offer' && (
              <div className="aurora w-[300px] h-[300px] -top-32 -right-20 bg-emerald-500/10" />
            )}

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
              {/* left: identity + progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                  <UniMark initials={a.initials} active={a.status === 'offer'} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <p className="font-semibold text-[16px]">{a.uniName}</p>
                      <StatusChip status={a.status} />
                    </div>
                    <p className="text-[13px] text-white/45 mt-1">{a.program} · {a.city}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">QS World Ranking #{a.rank}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-violet-200">
                      <Plane className="size-3" /> Visa: {(a.visaStatus ?? 'not-started').replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                    </div>
                  </div>
                </div>

                {/* stage stepper */}
                <div className="flex items-center mt-6 max-w-md">
                  {a.stages.map((s, j) => (
                    <div key={s.label} className={cn('flex items-center', j < a.stages.length - 1 && 'flex-1')}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center border transition-all',
                            s.state === 'done'
                              ? a.status === 'offer'
                                ? 'bg-emerald-400 border-emerald-400 text-[#0a0f24]'
                                : 'bg-amber-400 border-amber-400 text-[#0a0f24]'
                              : s.state === 'current'
                                ? 'border-amber-400/70 text-amber-300'
                                : 'border-white/15 text-white/25'
                          )}
                        >
                          {s.state === 'done' ? <Check className="w-3.5 h-3.5" strokeWidth={3.2} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <span className={cn('text-[10px] whitespace-nowrap', s.state === 'todo' ? 'text-white/25' : 'text-white/60')}>
                          {s.label}{s.date ? ` · ${s.date}` : ''}
                        </span>
                      </div>
                      {j < a.stages.length - 1 && (
                        <div className={cn('flex-1 h-px mx-2 -mt-4', a.stages[j + 1].state !== 'todo' ? 'bg-gradient-to-r from-amber-300 to-amber-500' : 'bg-white/10')} />
                      )}
                    </div>
                  ))}
                </div>

                {a.status !== 'offer' && (
                  <div className="flex items-center gap-3 mt-5">
                    <Bar value={a.progress} className="flex-1 max-w-xs" />
                    <span className="text-[11px] font-semibold text-white/50">{a.progress}%</span>
                  </div>
                )}
              </div>

              {/* right: action panel */}
              <div className="lg:w-[290px] shrink-0">
                {a.status === 'offer' && (
                  <div className="rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/25 p-4.5">
                    <div className="flex items-center gap-2.5">
                      <PartyPopper className="w-4.5 h-4.5 text-emerald-300" />
                      <p className="font-semibold text-[14px] text-emerald-200">Congratulations!</p>
                    </div>
                    <p className="text-[12px] text-white/50 mt-2 leading-relaxed">
                      Conditional offer — maintain GPA 3.5+ and submit IELTS 7.0.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[11px] text-white/45">
                      <CalendarClock className="w-3.5 h-3.5 text-emerald-300/80" />
                      Deposit due {fmtDate(a.deadline!)} · {daysUntil(a.deadline!)} days left
                    </div>
                    <button className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-300 to-emerald-500 text-[#06251a] font-semibold text-[13px] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all shadow-[0_8px_30px_-8px_rgba(52,211,153,0.45)]">
                      Accept offer <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}

                {a.status === 'under-review' && (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4.5">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4.5 h-4.5 text-sky-300" />
                      <p className="font-semibold text-[14px]">With the admissions team</p>
                    </div>
                    <p className="text-[12px] text-white/50 mt-2 leading-relaxed">
                      Nothing needed from you right now. Decisions for this program are running about two weeks behind.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[11px] text-white/45">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-300/80" />
                      All documents verified
                    </div>
                  </div>
                )}

                {a.status === 'in-progress' && (
                  <div className="rounded-2xl bg-amber-400/[0.06] border border-amber-400/25 p-4.5">
                    <div className="flex items-center gap-2.5">
                      <PenLine className="w-4.5 h-4.5 text-amber-300" />
                      <p className="font-semibold text-[14px] text-amber-100">Next: {a.nextAction}</p>
                    </div>
                    {a.deadline && (
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-white/45">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-300/80" />
                        Deadline {fmtDate(a.deadline)} · {daysUntil(a.deadline)} days left
                      </div>
                    )}
                    <button className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-[13px] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)]">
                      Continue application <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </motion.div>
      ))}

      {/* offer banner */}
      {hasOffer && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
          <Panel className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-amber-400/20 bg-gradient-to-r from-amber-400/[0.06] to-transparent">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px]">You're in a strong position.</p>
              <p className="text-[13px] text-white/45 mt-1">With an offer secured, Priya suggests adding one more ambitious pick before the January deadlines.</p>
            </div>
            <button
              onClick={() => onNavigate('universities')}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold border border-amber-400/40 text-amber-200 hover:bg-amber-400/10 transition-all shrink-0"
            >
              Explore matches <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </Panel>
        </motion.div>
      )}
    </div>
  )
}
