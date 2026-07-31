'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from '@/lib/navigation'
import { Search, Bell, Compass, ArrowRight, Sparkles, MoreHorizontal, X } from 'lucide-react'
import Sidebar, { TABS, type TabId } from '@/components/dashboard/Sidebar'
import Overview from '@/components/dashboard/Overview'
import Applications from '@/components/dashboard/Applications'
import UniversitiesTab from '@/components/dashboard/UniversitiesTab'
import Documents from '@/components/dashboard/Documents'
import Deadlines from '@/components/dashboard/Deadlines'
import Messages from '@/components/dashboard/Messages'
import Settings from '@/components/dashboard/Settings'
import Notifications from '@/components/dashboard/Notifications'
import {
  CONVERSATIONS,
} from '@/data/dashboard'
import type { Application, Deadline, DocItem, Notice, Task } from '@/data/dashboard'
import { buildStudent, buildRecommendations } from '@/data/student'
import { useAppStore, type Account } from '@/lib/store'
import { Avatar } from '@/components/dashboard/bits'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { myProfileQuery } from '@/features/profile/profile.queries'
import { myDashboardQuery } from '@/features/workflow/workflow.queries'
import { logoutFn, updateMyAccountFn } from '@/features/auth/auth.functions'
import { saveMyProfileFn } from '@/features/profile/profile.functions'
import { toggleTaskFn } from '@/features/workflow/workflow.functions'

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Your home',
  applications: 'Applications',
  universities: 'Discover universities',
  documents: 'Document center',
  deadlines: 'Calendar & deadlines',
  messages: 'Messages',
  settings: 'Profile & settings',
}

const TAB_DESCRIPTIONS: Record<TabId, string> = {
  overview: 'Your study abroad journey at a glance',
  applications: 'Track every submission, decision, and next action',
  universities: 'Explore matches built around your goals and profile',
  documents: 'Keep your application documents ready and verified',
  deadlines: 'See every important date before it becomes urgent',
  messages: 'Stay connected with your Mygreat support team',
  settings: 'Manage your personal, academic, and account details',
}

export default function Dashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabId>('overview')
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const { data: profile } = useSuspenseQuery(myProfileQuery)
  const { data: serverDashboard } = useSuspenseQuery(myDashboardQuery)
  const clearStore = useAppStore((state) => state.clear)
  const theme = useAppStore((state) => state.theme)
  const account: Account | null = user ? { name: user.name, email: user.email, phone: user.phone } : null

  const student = useMemo(
    () => profile ? buildStudent(profile, account) : buildStudent({ country: null, educationLevel: '', degree: '', field: '', gpa: 0, gradYear: '', englishTest: '', intake: '', universities: [], notSure: true }, account),
    [profile, account]
  )
  const applications = useMemo<Application[]>(() => serverDashboard.applications.map((item) => ({
    id: item.id,
    uniName: item.universityName,
    initials: item.universityName.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase(),
    city: item.city,
    program: item.program,
    rank: item.rank,
    status: item.status === 'OFFER' ? 'offer' : item.status === 'UNDER_REVIEW' ? 'under-review' : item.status === 'SUBMITTED' ? 'submitted' : 'in-progress',
    progress: item.progress,
    nextAction: item.nextAction,
    deadline: item.deadline ?? undefined,
    deadlineLabel: item.deadline ? 'Application deadline' : undefined,
    stages: [{ label: item.status.replaceAll('_', ' '), state: 'current' }],
    visaStatus: item.visaStatus.toLowerCase().replaceAll('_', '-') as Application['visaStatus'],
  })), [serverDashboard.applications])
  const recommendations = useMemo(
    () => profile ? buildRecommendations(profile) : [],
    [profile]
  )
  const deadlines: Deadline[] = serverDashboard.deadlines.map((item) => ({ id: item.id, label: item.label, org: item.organization, date: item.dueDate, type: item.type.toLowerCase() as Deadline['type'] }))
  const tasks: Task[] = serverDashboard.tasks.map((item) => ({ id: item.id, label: item.label, due: item.dueDate ?? undefined, tag: item.tag, done: item.completed }))
  const documentItems: DocItem[] = serverDashboard.documents.map((item) => ({ id: item.id, name: item.name, status: item.status.toLowerCase() as DocItem['status'], note: item.note }))
  const [unread, setUnread] = useState(CONVERSATIONS[0].unread)
  const [notices, setNotices] = useState<Notice[]>(() => serverDashboard.notifications.map((item) => ({ id: item.id, kind: item.kind === 'DOCUMENT' ? 'doc' : item.kind.toLowerCase() as Notice['kind'], title: item.title, desc: item.description, time: 'Recently', read: Boolean(item.readAt) })))
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMobileMore, setShowMobileMore] = useState(false)

  const unreadNotifs = notices.filter((n) => !n.read).length

  const taskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleTaskFn({ data: { taskId: id, completed } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] }),
  })
  const toggleTask = (id: string) => {
    const task = tasks.find((item) => item.id === id)
    if (task) taskMutation.mutate({ id, completed: !task.done })
  }

  const handleSaveAccount = (a: Account) => {
    updateMyAccountFn({ data: a }).then(() => queryClient.invalidateQueries({ queryKey: ['auth'] }))
  }

  const handleSaveProfile = (p: NonNullable<typeof profile>) => {
    saveMyProfileFn({ data: p }).then(() => queryClient.invalidateQueries({ queryKey: ['student'] }))
  }

  const signOut = async () => {
    await logoutFn()
    queryClient.clear()
    clearStore()
    router.push('/login')
  }

  return (
    <div className={cn(theme === 'light' && 'light-theme', 'student-dashboard relative h-screen bg-[#060a18] text-white overflow-hidden')}>
      <div className="aurora w-[500px] h-[500px] -top-48 right-[-8%] bg-violet-700/12" />
      <div className="aurora w-[400px] h-[400px] bottom-[-20%] left-[15%] bg-indigo-600/10" />

      <div className="relative flex h-full">
        <Sidebar tab={tab} onChange={setTab} unread={unread} profileComplete={student.profileComplete} />

        <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
          {/* top bar */}
          <header className="dashboard-header shrink-0 border-b border-white/[0.06] bg-[#070b18]/55 px-4 py-3.5 backdrop-blur-xl sm:px-7 lg:px-8 lg:py-4 flex items-center gap-3 lg:gap-5">
            {/* mobile brand */}
            <div className="flex lg:hidden items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center">
                <Compass className="w-4.5 h-4.5 text-[#0a0f24]" strokeWidth={2.4} />
              </div>
              <span className="font-display text-lg">Mygreat</span>
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">Student portal</span>
                <span className="size-1 rounded-full bg-white/15" />
                <span className="truncate text-[10px] text-white/28">{student.target}</span>
              </div>
              <h1 className="mt-0.5 truncate font-display text-xl text-white/90">{TAB_TITLES[tab]}</h1>
              <p className="mt-0.5 truncate text-[10.5px] text-white/32">{TAB_DESCRIPTIONS[tab]}</p>
            </div>

            <div className="flex-1" />

            <div className="relative hidden w-60 xl:block 2xl:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                placeholder="Search universities, docs…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[13px] placeholder:text-white/30 outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>

            <button
              onClick={() => setTab('universities')}
              className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2.5 text-xs font-bold text-[#10172a] shadow-[0_8px_24px_-10px_rgba(245,158,11,.75)] transition hover:-translate-y-0.5 md:inline-flex"
            >
              <Sparkles className="size-3.5" /> Explore matches <ArrowRight className="size-3.5" />
            </button>

            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setShowNotifs((s) => !s)}
                className={cn(
                  'relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
                  showNotifs
                    ? 'border-amber-400/50 text-amber-300 bg-amber-400/[0.08]'
                    : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
                )}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-amber-400 text-[#0a0f24] text-[9.5px] font-bold flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <Notifications
                    notices={notices}
                    onMarkAll={() => setNotices((ns) => ns.map((n) => ({ ...n, read: true })))}
                    onClose={() => setShowNotifs(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setTab('settings')} className="flex items-center gap-3 pl-1 group">
              <Avatar initials={student.initials} className="w-10 h-10 text-xs group-hover:ring-2 ring-amber-400/50 transition-all" />
              <div className="hidden xl:block text-left">
                <p className="text-[13px] font-semibold leading-none group-hover:text-amber-200 transition-colors">{student.name}</p>
                <p className="text-[11px] text-white/40 mt-1">{student.intake} applicant</p>
              </div>
            </button>
          </header>

          {/* content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-4 pb-28 pt-5 sm:px-8 sm:pt-7 lg:pb-7 max-w-[1400px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {tab === 'overview' && (
                    <Overview
                      student={student}
                      applications={applications}
                      recommendations={recommendations}
                      deadlines={deadlines}
                      tasks={tasks}
                      onToggleTask={toggleTask}
                      onNavigate={setTab}
                    />
                  )}
                  {tab === 'applications' && <Applications applications={applications} onNavigate={setTab} />}
                  {tab === 'universities' && (
                    <UniversitiesTab student={student} shortlisted={profile?.universities ?? []} recommendations={recommendations} />
                  )}
                  {tab === 'documents' && <Documents documents={documentItems} />}
                  {tab === 'deadlines' && <Deadlines deadlines={deadlines} />}
                  {tab === 'messages' && <Messages onRead={() => setUnread(0)} />}
                  {tab === 'settings' && (
                    <Settings
                      profile={profile}
                      account={account}
                      onSaveAccount={handleSaveAccount}
                      onSaveProfile={handleSaveProfile}
                      onSignOut={signOut}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Thumb-friendly mobile navigation */}
          <nav className="mobile-dashboard-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#080d1d]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden" aria-label="Student navigation">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
              {(['overview', 'universities', 'applications'] as TabId[]).map((id) => {
                const item = TABS.find((entry) => entry.id === id)!
                const active = tab === id
                return (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setShowMobileMore(false) }}
                    className={cn('relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-semibold transition', active ? 'mobile-dashboard-nav-active bg-amber-300/[0.1] text-amber-200' : 'text-white/38 active:bg-white/[0.05]')}
                  >
                    <span className="relative"><item.icon className={cn('size-[18px]', active ? 'text-amber-300' : 'text-white/38')} /></span>
                    <span className="max-w-full truncate">{item.label}</span>
                  </button>
                )
              })}
              <button
                onClick={() => setShowMobileMore(true)}
                className={cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-semibold transition', ['deadlines', 'documents', 'messages', 'settings'].includes(tab) ? 'mobile-dashboard-nav-active bg-amber-300/[0.1] text-amber-200' : 'text-white/38 active:bg-white/[0.05]')}
              >
                <MoreHorizontal className="size-[19px]" /><span>More</span>
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {showMobileMore && (
              <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button aria-label="Close navigation menu" onClick={() => setShowMobileMore(false)} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
                <motion.section initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className="mobile-more-sheet absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border-t border-white/10 bg-[#0b1122] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
                  <div className="flex items-center justify-between"><div><p className="font-display text-xl">More tools</p><p className="mt-1 text-xs text-white/35">Discovery, planning, and account preferences</p></div><button onClick={() => setShowMobileMore(false)} className="grid size-10 place-items-center rounded-xl border border-white/10"><X className="size-4" /></button></div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {(['deadlines', 'documents', 'messages', 'settings'] as TabId[]).map((id) => {
                      const item = TABS.find((entry) => entry.id === id)!
                      const descriptions: Record<'deadlines' | 'documents' | 'messages' | 'settings', string> = {
                        deadlines: 'View important dates and tasks',
                        documents: 'Upload and track your files',
                        messages: 'Chat with your support team',
                        settings: 'Profile, preferences, and sign out',
                      }
                      return <button key={id} onClick={() => { setTab(id); setShowMobileMore(false) }} className={cn('mobile-more-item relative rounded-2xl border p-4 text-left transition', tab === id ? 'border-amber-300/30 bg-amber-300/[0.09]' : 'border-white/[0.08] bg-white/[0.035]')}><span className={cn('grid size-10 place-items-center rounded-xl', tab === id ? 'bg-amber-400 text-[#10172a]' : 'bg-white/[0.06] text-white/55')}><item.icon className="size-4.5" /></span>{id === 'messages' && unread > 0 && <span className="absolute right-3 top-3 grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 text-[9px] font-bold leading-5 text-[#10172a]">{unread}</span>}<p className="mt-4 text-sm font-semibold">{item.label}</p><p className="mt-1 text-[10.5px] leading-4 text-white/32">{descriptions[id as keyof typeof descriptions]}</p></button>
                    })}
                  </div>
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
