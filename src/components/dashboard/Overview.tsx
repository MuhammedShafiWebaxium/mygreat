import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock3, FileCheck2, FileText, GraduationCap, ListChecks, Send, ShieldCheck } from 'lucide-react'
import type { Application, Reco, StudentProfile, Task } from '@/data/dashboard'
import { Panel, StatusChip, UniMark, fadeUp } from './bits'
import { cn } from '@/lib/utils'
import type { TabId } from './Sidebar'

interface Props {
  student: StudentProfile
  applications: Application[]
  recommendations: Reco[]
  tasks: Task[]
  shortlistedCount: number
  documentStats: { uploaded: number; verified: number; pending: number; needed: number; total: number }
  onToggleTask: (id: string) => void
  onNavigate: (tab: TabId) => void
}

const greeting = () => {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview({ student, applications, recommendations, tasks, shortlistedCount, documentStats, onToggleTask, onNavigate }: Props) {
  const profileReady = student.profileComplete >= 100
  const courseReady = !student.target.toLowerCase().includes('exploring')
  const shortlistReady = shortlistedCount > 0
  const documentsUploaded = documentStats.uploaded === documentStats.total
  const documentsVerified = documentStats.verified === documentStats.total
  const prerequisites = [profileReady, courseReady, shortlistReady, documentsUploaded, documentsVerified]
  const completedPrerequisites = prerequisites.filter(Boolean).length
  const readiness = completedPrerequisites * 20
  const openTasks = tasks.filter((task) => !task.done)
  const offers = applications.filter((application) => application.status === 'offer').length

  const state = !profileReady
    ? { stage: 'Profile', kicker: 'Complete your study plan', title: 'Your profile needs a few more details', body: 'Finish your academic and personal information before moving to university selection.', badge: 'Action required', cta: 'Complete profile', tab: 'settings' as TabId }
    : !courseReady
      ? { stage: 'Course selection', kicker: 'Choose your programme', title: 'Select the course you want to study', body: 'Your course determines which universities and programmes we can show you.', badge: 'Action required', cta: 'Select course', tab: 'settings' as TabId }
      : !shortlistReady
        ? { stage: 'Shortlist', kicker: 'Choose your universities', title: 'Build your university shortlist', body: 'Select at least one university offering your chosen course before preparing an application.', badge: 'Action required', cta: 'Explore universities', tab: 'universities' as TabId }
        : !documentsUploaded
          ? { stage: 'Documents', kicker: 'Application prerequisite', title: `Upload ${documentStats.total - documentStats.uploaded} remaining ${documentStats.total - documentStats.uploaded === 1 ? 'document' : 'documents'}`, body: 'Passport, photograph, CV and Aadhaar are required before staff can create an application.', badge: 'Upload required', cta: 'Upload documents', tab: 'documents' as TabId }
          : !documentsVerified
            ? { stage: 'Documents', kicker: 'Next action', title: 'Your documents are being verified', body: documentStats.needed > 0 ? `${documentStats.needed} document needs to be replaced before your application can begin.` : 'All required files are uploaded. Our team is reviewing them; applications can begin as soon as they are approved.', badge: documentStats.needed > 0 ? 'Replacement required' : 'Under verification', cta: 'View document status', tab: 'documents' as TabId }
            : applications.length === 0
              ? { stage: 'Application ready', kicker: 'Prerequisites complete', title: 'You are ready to start applying', body: 'Your profile, shortlist and documents are ready. Staff can now create your university applications.', badge: 'Ready for staff', cta: 'View shortlist', tab: 'universities' as TabId }
              : openTasks.length > 0
                ? { stage: 'Applications', kicker: 'Next action', title: openTasks[0].label, body: openTasks[0].due ? `Complete this before ${new Date(openTasks[0].due).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} to keep your application moving.` : 'Complete this task to keep your application moving.', badge: 'Action required', cta: 'View applications', tab: 'applications' as TabId }
                : { stage: offers ? 'Decision' : 'Applications', kicker: 'Current status', title: offers ? `You have ${offers} ${offers === 1 ? 'offer' : 'offers'}` : 'Your applications are progressing', body: offers ? 'Review your offer and continue with the next admission steps.' : 'There is nothing required from you right now. We will notify you when the next action is available.', badge: 'No action required', cta: 'Track applications', tab: 'applications' as TabId }

  const journey = [
    { label: 'Profile', done: profileReady },
    { label: 'Shortlist', done: shortlistReady },
    { label: 'Documents', done: documentsVerified },
    { label: 'Applications', done: applications.length > 0 },
    { label: 'Decision', done: offers > 0 },
    { label: 'Visa', done: applications.some((item) => item.visaStatus === 'visa-granted') },
    { label: 'Enrolment', done: false },
  ]
  const currentJourney = Math.min(journey.findIndex((step) => !step.done), journey.length - 1)

  const readinessRows = [
    { label: 'Profile completed', value: `${student.profileComplete}%`, done: profileReady, tab: 'settings' as TabId },
    { label: 'Course selected', value: courseReady ? student.target : 'Not selected', done: courseReady, tab: 'settings' as TabId },
    { label: 'University shortlisted', value: `${shortlistedCount} selected`, done: shortlistReady, tab: 'universities' as TabId },
    { label: 'Required documents uploaded', value: `${documentStats.uploaded}/${documentStats.total}`, done: documentsUploaded, tab: 'documents' as TabId },
    { label: 'Documents verified', value: `${documentStats.verified}/${documentStats.total}`, done: documentsVerified, pending: documentStats.pending > 0, tab: 'documents' as TabId },
  ]

  return <div className="student-home space-y-4 sm:space-y-5">
    <motion.header variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[9px] font-bold uppercase tracking-[.24em] text-amber-400">Your study plan</p><h2 className="mt-2 font-display text-3xl font-light sm:text-4xl">{greeting()}, <span className="text-gradient-gold font-medium">{student.firstName}.</span></h2><div className="mt-2 flex flex-wrap gap-x-2 text-[10px] text-white/38"><span>{student.target}</span><span>·</span><span>{student.country}</span><span>·</span><span>{student.intake}</span></div></div>
      <div className="border-l-2 border-amber-400 pl-4 sm:text-right"><p className="text-[8px] font-bold uppercase tracking-[.18em] text-white/30">Current stage</p><p className="mt-1 font-display text-xl">{state.stage}</p><p className="text-[9px] text-white/35">{state.badge}</p></div>
    </motion.header>

    <motion.section variants={fadeUp} initial="hidden" animate="show" custom={1} className="relative overflow-hidden rounded-[1.75rem] border border-amber-300/15 bg-gradient-to-br from-white/[.045] via-white/[.025] to-amber-300/[.08] p-6 shadow-xl shadow-black/[.08] sm:p-8">
      <motion.div className="absolute -right-20 -top-28 size-80 rounded-full bg-amber-300/10 blur-3xl" animate={{ opacity: [.45, .85, .45], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity }} />
      <div className="relative grid gap-8 md:grid-cols-[1fr_220px] md:items-center">
        <div><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-amber-300"><span className="size-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.8)]" />{state.kicker}</p><h3 className="mt-4 max-w-3xl font-display text-2xl leading-tight sm:text-3xl">{state.title}</h3><p className="mt-3 max-w-2xl text-xs leading-5 text-white/42">{state.body}</p><div className="mt-5 flex flex-wrap items-center gap-3"><span className={cn('rounded-full border px-3 py-1.5 text-[9px] font-bold', state.badge === 'Under verification' ? 'border-amber-300/20 bg-amber-300/10 text-amber-300' : state.badge === 'No action required' || state.badge === 'Ready for staff' ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-300' : 'border-rose-300/20 bg-rose-300/10 text-rose-300')}>{state.badge}</span><span className="text-[10px] text-white/32">{completedPrerequisites} of 5 prerequisites complete</span></div><button onClick={() => onNavigate(state.tab)} className="mt-5 inline-flex items-center gap-3 rounded-xl bg-amber-400 px-5 py-3 text-[11px] font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-300">{state.cta}<ArrowRight className="size-3.5" /></button></div>
        <div className="mx-auto text-center"><div className="relative grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(#f5ad00 ${readiness * 3.6}deg, rgba(148,163,184,.16) 0)` }}><div className="absolute inset-[9px] rounded-full bg-[#0b1122] student-readiness-center" /><div className="relative"><p className="font-display text-4xl text-gradient-gold">{readiness}%</p><p className="mt-1 text-[7px] font-bold uppercase tracking-[.2em] text-white/35">Application<br />readiness</p></div></div><p className="mt-3 text-[9px] text-white/35">{completedPrerequisites} of 5 prerequisites complete</p></div>
      </div>
    </motion.section>

    <motion.section variants={fadeUp} initial="hidden" animate="show" custom={2}><Panel className="student-journey-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[8px] font-bold uppercase tracking-[.22em] text-amber-300/75">Your journey</p><h3 className="mt-2 font-display text-xl">From preparation to enrolment</h3></div><span className="student-journey-badge rounded-full bg-amber-300/10 px-3 py-1.5 text-[8px] font-bold text-amber-300">● Current stage</span></div><div className="mt-7 overflow-x-auto pb-1"><div className="flex min-w-[670px] items-start">{journey.map((step, index) => <div key={step.label} className={cn('relative flex flex-1 flex-col items-center', index === journey.length - 1 && 'flex-none w-16')}><div className={cn('student-journey-connector absolute left-0 top-3 h-px w-full -translate-x-1/2', index === 0 ? 'hidden' : step.done || index <= currentJourney ? 'student-journey-connector-complete bg-emerald-400' : 'bg-white/10')} /><motion.span initial={{ scale: .7 }} animate={{ scale: 1 }} transition={{ delay: .08 * index }} className={cn('relative z-10 grid size-7 place-items-center rounded-full border text-[9px] font-bold', step.done ? 'border-emerald-400 bg-emerald-400 text-slate-950' : index === currentJourney ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-[0_0_0_5px_rgba(251,191,36,.12)]' : 'student-journey-upcoming border-white/12 bg-[#0b1122] text-white/30')}>{step.done ? <Check className="size-3" /> : index + 1}</motion.span><p className={cn('mt-3 text-[9px] font-semibold', index === currentJourney ? 'text-amber-300' : step.done ? 'text-emerald-300' : 'text-white/35')}>{step.label}</p><p className="mt-1 text-[7px] text-white/25">{step.done ? 'Complete' : index === currentJourney ? 'Current' : 'Upcoming'}</p></div>)}</div></div></Panel></motion.section>

    <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}><Panel className="h-full overflow-hidden"><div className="flex items-center border-b border-white/[.07] px-5 py-4"><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-amber-300/70">Before you apply</p><h3 className="mt-2 font-display text-xl">Application readiness</h3><p className="mt-1 text-[9px] text-white/32">Every item must be complete before staff can create an application.</p></div><span className="ml-auto font-display text-2xl text-gradient-gold">{completedPrerequisites}/5</span></div><div className="divide-y divide-white/[.06] px-5">{readinessRows.map((row) => <button key={row.label} onClick={() => onNavigate(row.tab)} className="flex w-full items-center gap-3 py-3 text-left"><span className={cn('grid size-6 place-items-center rounded-full', row.done ? 'bg-emerald-400/15 text-emerald-300' : row.pending ? 'bg-amber-400/15 text-amber-300' : 'bg-white/[.05] text-white/25')}>{row.done ? <Check className="size-3.5" /> : row.pending ? <Clock3 className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}</span><span className="flex-1 text-[11px] font-semibold">{row.label}</span><span className={cn('max-w-[45%] truncate text-[9px]', row.done ? 'text-emerald-300' : row.pending ? 'text-amber-300' : 'text-white/32')}>{row.done ? 'Completed' : row.pending ? 'Under review' : row.value}</span><ArrowRight className="size-3 text-white/20" /></button>)}</div></Panel></motion.div>
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}><Panel className="h-full overflow-hidden"><div className="flex items-start border-b border-white/[.07] px-5 py-4"><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-amber-300/70">Document center</p><h3 className="mt-2 font-display text-xl">Required documents</h3></div><button onClick={() => onNavigate('documents')} className="ml-auto text-[9px] font-bold text-amber-300">View all →</button></div><div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">{[{ label: 'Uploaded', value: documentStats.uploaded, icon: FileText }, { label: 'Verified', value: documentStats.verified, icon: FileCheck2 }, { label: 'In review', value: documentStats.pending, icon: Clock3 }, { label: 'Replace', value: documentStats.needed, icon: ShieldCheck }].map((metric) => <div key={metric.label} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><metric.icon className="size-4 text-amber-300" /><p className="mt-4 font-display text-2xl">{metric.value}</p><p className="mt-1 text-[9px] text-white/35">{metric.label}</p></div>)}</div>{documentStats.pending > 0 && <div className="mx-5 mb-5 rounded-xl border border-amber-300/15 bg-amber-300/[.06] px-4 py-3 text-[9px] text-amber-200">Verification is in progress. You do not need to upload these files again.</div>}</Panel></motion.div>
    </div>

    {(applications.length > 0 || tasks.length > 0) && <div className="grid gap-4 lg:grid-cols-2"><Panel><div className="flex items-center border-b border-white/[.07] px-5 py-4"><Send className="size-4 text-amber-300" /><h3 className="ml-2 font-display text-lg">Applications</h3><button onClick={() => onNavigate('applications')} className="ml-auto text-[9px] font-bold text-amber-300">View all →</button></div><div className="space-y-2 p-3">{applications.slice(0, 3).map((application) => <button key={application.id} onClick={() => onNavigate('applications')} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/[.03]"><UniMark initials={application.initials} /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{application.uniName}</p><p className="mt-1 truncate text-[9px] text-white/32">{application.nextAction}</p></div><StatusChip status={application.status} /></button>)}</div></Panel><Panel><div className="flex items-center border-b border-white/[.07] px-5 py-4"><ListChecks className="size-4 text-sky-300" /><h3 className="ml-2 font-display text-lg">Your tasks</h3><span className="ml-auto text-[9px] text-white/35">{openTasks.length} open</span></div><div className="divide-y divide-white/[.05] px-4">{tasks.slice(0, 5).map((task) => <button key={task.id} onClick={() => onToggleTask(task.id)} className="flex w-full items-center gap-3 py-3 text-left"><span className={cn('grid size-5 place-items-center rounded-md border', task.done ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/15')}>{task.done && <Check className="size-3" />}</span><span className={cn('flex-1 text-[10px]', task.done && 'text-white/30 line-through')}>{task.label}</span></button>)}</div></Panel></div>}

    {recommendations.length > 0 && <Panel><div className="flex items-center border-b border-white/[.07] px-5 py-4"><GraduationCap className="size-4 text-indigo-300" /><h3 className="ml-2 font-display text-lg">Universities offering your course</h3><button onClick={() => onNavigate('universities')} className="ml-auto text-[9px] font-bold text-amber-300">Explore all →</button></div><div className="grid gap-3 p-4 sm:grid-cols-3">{recommendations.slice(0, 3).map((university) => <button key={university.id} onClick={() => onNavigate('universities')} className="rounded-xl border border-white/[.07] p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/20"><p className="truncate text-[11px] font-semibold">{university.name}</p><p className="mt-1 text-[9px] text-white/32">{university.city}</p><p className="mt-3 text-[9px] font-semibold text-emerald-300">Selected course available</p></button>)}</div></Panel>}
  </div>
}
