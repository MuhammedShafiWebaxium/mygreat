import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Trophy, Clock, PenLine, PartyPopper, CalendarClock, ShieldCheck, Compass, Plane, FileText, Upload, X, CheckCircle2, AlertCircle, Sparkles, BookOpen, Lock } from 'lucide-react'
import { daysUntil, fmtDate } from '@/data/dashboard'
import type { Application } from '@/data/dashboard'
import { Panel, StatusChip, Bar, UniMark, fadeUp } from './bits'
import { cn } from '@/lib/utils'
import type { TabId } from './Sidebar'
import { acceptStudentOfferFn } from '@/features/workflow/workflow.functions'

interface Props {
  applications: Application[]
  documentsComplete: boolean
  onNavigate: (t: TabId) => void
  onChanged?: () => Promise<unknown> | void
}

export default function Applications({ applications, documentsComplete, onNavigate, onChanged }: Props) {
  const hasOffer = applications.some((a) => a.status === 'offer')

  // Identify any application currently in active visa processing
  const activeVisaApp = applications.find(
    (a) => a.visaStatus && a.visaStatus !== 'not-started' && a.visaStatus !== 'reapply-or-appeal'
  )

  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [acknowledgmentLetter, setAcknowledgmentLetter] = useState('')
  const [acknowledgmentFile, setAcknowledgmentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const defaultTemplate = (uniName: string, courseName: string) =>
    `I hereby formally accept the admission offer for ${courseName} at ${uniName}. I confirm my commitment to enroll and proceed with the deposit payment and visa application requirements.`

  const handleOpenAcceptModal = (app: Application) => {
    const rawOptions = app.program.split(',').map((s) => s.trim()).filter(Boolean)
    const options = rawOptions.length > 0 ? rawOptions : [app.program]
    const initialCourse = options[0]

    setSelectedApp(app)
    setCourseOptions(options)
    setSelectedCourse(initialCourse)
    setAcknowledgmentLetter(defaultTemplate(app.uniName, initialCourse))
    setAcknowledgmentFile(null)
    setMessage(null)
  }

  const handleCourseChange = (course: string) => {
    if (!selectedApp) return
    setSelectedCourse(course)
    setAcknowledgmentLetter(defaultTemplate(selectedApp.uniName, course))
  }

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApp) return
    try {
      setSubmitting(true)
      setMessage(null)
      await acceptStudentOfferFn({
        applicationId: selectedApp.id,
        acknowledgmentLetter: acknowledgmentLetter.trim(),
        acceptedCourse: selectedCourse,
        file: acknowledgmentFile,
      })
      setMessage({ type: 'success', text: 'Offer accepted successfully! Your acknowledgement letter has been recorded.' })
      if (onChanged) await onChanged()
      setTimeout(() => {
        setSelectedApp(null)
        setMessage(null)
      }, 1600)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit offer acceptance.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!documentsComplete && applications.length === 0) {
    return (
      <div className="max-w-5xl space-y-5">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <h2 className="font-display text-2xl font-light sm:text-3xl">
            Application <span className="text-gradient-gold font-medium">prerequisites</span>
          </h2>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
          <Panel className="border-dashed p-10 text-center sm:p-14">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
              <ShieldCheck className="size-6 text-amber-300" />
            </div>
            <h3 className="mt-6 font-display text-2xl">Upload your required documents first</h3>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/45">
              All documents configured by your admissions team must be uploaded and verified before an application can be created.
            </p>
            <button
              onClick={() => onNavigate('documents')}
              className="mt-7 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-7 py-4 text-sm font-semibold text-[#0a0f24] shadow-[0_10px_36px_-8px_rgba(242,179,11,.55)]"
            >
              Upload documents <ArrowRight className="size-4" />
            </button>
          </Panel>
        </motion.div>
      </div>
    )
  }

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

      {applications.map((a, i) => {
        const hasValidDeadline = Boolean(a.deadline && fmtDate(a.deadline))
        const isAppActiveVisa = activeVisaApp?.id === a.id
        const isBlockedByOtherVisa = Boolean(activeVisaApp && activeVisaApp.id !== a.id)

        return (
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
                              s.state === 'done' || s.state === 'current'
                                ? 'bg-emerald-400 border-emerald-400 text-[#0a0f24]'
                                : 'border-white/15 text-white/25'
                            )}
                          >
                            {s.state === 'done' || s.state === 'current' ? <Check className="w-3.5 h-3.5" strokeWidth={3.2} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                          </div>
                          <span className={cn('text-[10px] whitespace-nowrap', s.state === 'todo' ? 'text-white/25' : 'text-emerald-300 font-medium')}>
                            {s.label}{s.date ? ` · ${s.date}` : ''}
                          </span>
                        </div>
                        {j < a.stages.length - 1 && (
                          <div className={cn('flex-1 h-px mx-2 -mt-4', a.stages[j + 1].state !== 'todo' ? 'bg-gradient-to-r from-emerald-300 to-emerald-500' : 'bg-white/10')} />
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
                  {a.status === 'offer' && isAppActiveVisa && (
                    <div className="rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/25 p-4.5">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-300" />
                        <p className="font-semibold text-[14px] text-emerald-200">Active Accepted Offer</p>
                      </div>
                      <p className="text-[12px] text-white/50 mt-2 leading-relaxed">
                        Offer accepted! This course application is actively proceeding in the visa stage.
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-emerald-300/80">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Visa documents active on Documents tab
                      </div>
                    </div>
                  )}

                  {a.status === 'offer' && isBlockedByOtherVisa && (
                    <div className="rounded-2xl bg-amber-400/[0.06] border border-amber-400/25 p-4.5">
                      <div className="flex items-center gap-2.5">
                        <Lock className="w-4.5 h-4.5 text-amber-300" />
                        <p className="font-semibold text-[14px] text-amber-200">Offer Locked</p>
                      </div>
                      <p className="text-[11.5px] text-white/50 mt-2 leading-relaxed">
                        You have an active visa process underway for <span className="text-amber-200 font-medium">{activeVisaApp?.program}</span>. You can only proceed with one offer letter at a time.
                      </p>
                      <button
                        disabled
                        className="mt-4 w-full cursor-not-allowed opacity-40 inline-flex items-center justify-center gap-2 bg-white/10 text-white/60 font-semibold text-[12px] rounded-xl px-4 py-3"
                      >
                        <Lock className="w-3.5 h-3.5" /> Active Visa in Progress
                      </button>
                    </div>
                  )}

                  {a.status === 'offer' && !isAppActiveVisa && !isBlockedByOtherVisa && (
                    <div className="rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/25 p-4.5">
                      <div className="flex items-center gap-2.5">
                        <PartyPopper className="w-4.5 h-4.5 text-emerald-300" />
                        <p className="font-semibold text-[14px] text-emerald-200">Offer Received!</p>
                      </div>
                      <p className="text-[12px] text-white/50 mt-2 leading-relaxed">
                        Congratulations! Review and accept your admission offer below to write your acknowledgement letter and proceed to visa processing.
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-white/45">
                        <CalendarClock className="w-3.5 h-3.5 text-emerald-300/80" />
                        {hasValidDeadline
                          ? `Deposit due ${fmtDate(a.deadline)} · ${daysUntil(a.deadline)} days left`
                          : 'Deposit due: Standard intake schedule'}
                      </div>
                      <button
                        onClick={() => handleOpenAcceptModal(a)}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-300 to-emerald-500 text-[#06251a] font-semibold text-[13px] rounded-xl px-4 py-3 hover:-translate-y-0.5 transition-all shadow-[0_8px_30px_-8px_rgba(52,211,153,0.45)]"
                      >
                        Accept offer & Acknowledgment <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
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
                        Nothing needed from you right now. Decisions for this program are being processed by the university.
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
                      {hasValidDeadline && (
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
        )
      })}

      {/* offer banner */}
      {hasOffer && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
          <Panel className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-amber-400/20 bg-gradient-to-r from-amber-400/[0.06] to-transparent">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px]">You're in a strong position.</p>
              <p className="text-[13px] text-white/45 mt-1">With an offer secured, you can accept your offer to start visa processing or explore additional course choices.</p>
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

      {/* Interactive Accept Offer & Acknowledgement Letter Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setSelectedApp(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0f24] p-6 sm:p-7 shadow-2xl shadow-black text-white"
            >
              <button
                disabled={submitting}
                onClick={() => setSelectedApp(null)}
                className="absolute top-5 right-5 p-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-all disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500 flex items-center justify-center text-[#06251a] font-bold">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">Accept Offer & Submit Acknowledgement</h3>
                  <p className="text-xs text-white/40">Confirm your acceptance to proceed with visa processing</p>
                </div>
              </div>

              <div className="my-4 p-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] space-y-1">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">University</p>
                <p className="text-sm font-bold text-white">{selectedApp.uniName}</p>
              </div>

              <form onSubmit={handleAcceptSubmit} className="space-y-4">
                {/* Course Selection if multiple courses are present */}
                {courseOptions.length > 1 ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-white/80 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-300" /> Select the specific course you are accepting *
                    </label>
                    <div className="grid gap-2">
                      {courseOptions.map((c) => (
                        <div
                          key={c}
                          onClick={() => handleCourseChange(c)}
                          className={cn(
                            'flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition text-xs',
                            selectedCourse === c
                              ? 'border-emerald-400/80 bg-emerald-400/10 text-white font-medium shadow-md'
                              : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                          )}
                        >
                          <div
                            className={cn(
                              'size-4 rounded-full border flex items-center justify-center shrink-0',
                              selectedCourse === c ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'
                            )}
                          >
                            {selectedCourse === c && <div className="size-1.5 rounded-full bg-[#0a0f24]" />}
                          </div>
                          <span className="flex-1 leading-relaxed">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1">
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Confirmed Program</p>
                    <p className="text-xs font-medium text-white">{selectedCourse}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-300" /> Acknowledgement Letter / Declaration Statement *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={acknowledgmentLetter}
                    onChange={(e) => setAcknowledgmentLetter(e.target.value)}
                    placeholder="Write or edit your official acknowledgement statement..."
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-xs leading-relaxed text-white outline-none focus:border-emerald-400/60 transition"
                  />
                  <p className="text-[10.5px] text-white/35 mt-1">
                    This letter will be submitted to the admissions team and attached to your application record for visa processing.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-300" /> Signed Acceptance Form / File (Optional)
                  </label>
                  <div className="relative border border-dashed border-white/15 hover:border-emerald-400/40 rounded-2xl p-3.5 text-center bg-white/[0.02] transition">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setAcknowledgmentFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-white/70">
                      <Upload className="w-4 h-4 text-emerald-300" />
                      <span>{acknowledgmentFile ? acknowledgmentFile.name : 'Click to select signed PDF or document image'}</span>
                    </div>
                  </div>
                </div>

                {message && (
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl border text-xs flex items-center gap-2',
                      message.type === 'success'
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                    )}
                  >
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setSelectedApp(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !acknowledgmentLetter.trim() || !selectedCourse}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-300 to-emerald-500 text-xs font-bold text-[#06251a] shadow-lg flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#06251a] border-t-transparent rounded-full animate-spin" />
                        Submitting Acceptance…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Submit Acceptance & Acknowledgement
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
