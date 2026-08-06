import type { OnboardingData } from '@/types'
import type { Account } from '@/lib/store'
import { UNIVERSITIES } from './onboarding'
import type { Application, Deadline, Notice, Reco, StudentProfile, Task } from './dashboard'

const COUNTRY_DEADLINE: Record<string, string> = {
  us: '2026-12-15',
  uk: '2027-01-14',
  ca: '2027-01-15',
  au: '2026-11-15',
  de: '2027-03-15',
  ie: '2027-02-01',
  nz: '2026-10-01',
  nl: '2027-04-01',
  fr: '2027-01-31',
  sg: '2027-01-31',
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function buildStudent(p: OnboardingData, account: Account | null): StudentProfile {
  const name = account?.name?.trim() || 'Future Scholar'
  const first = name.split(' ')[0] || 'Scholar'
  return {
    name,
    firstName: first,
    initials: initialsOf(name) || 'FS',
    target: p.degree || 'Study Abroad',
    country: p.country?.name ?? 'Anywhere',
    flag: p.country?.flag ?? '🌍',
    intake: p.intake || 'Upcoming',
    gpa: p.gpa,
    profileComplete: Math.round(([p.country, p.educationLevel, p.degree, p.field, p.gpa > 0, p.gradYear, p.intake, account?.name, account?.email].filter(Boolean).length / 9) * 100),
    journeyStep: 2,
  }
}

export function buildApplications(p: OnboardingData): Application[] {
  const progresses = [45, 30, 20]
  const dl = COUNTRY_DEADLINE[p.country?.id ?? ''] ?? '2027-02-01'
  return p.universities.map((u, i) => ({
    id: u.id,
    uniName: u.name,
    initials: initialsOf(u.name),
    city: u.city,
    program: [p.degree, p.field].filter(Boolean).join(' in ') || 'Program TBD',
    rank: u.rank,
    status: 'in-progress' as const,
    progress: progresses[Math.min(i, progresses.length - 1)],
    nextAction: i === 0 ? 'Upload your final SOP' : 'Complete the application form',
    deadline: dl,
    deadlineLabel: 'Application deadline',
    stages: [
      { label: 'Application', state: 'current' as const },
      { label: 'Submit', state: 'todo' as const },
      { label: 'Review', state: 'todo' as const },
    ],
  }))
}

export function buildRecommendations(p: OnboardingData): Reco[] {
  if (!p.country) return []
  const shortlisted = new Set(p.universities.map((u) => u.id))
  return UNIVERSITIES.filter((u) => u.countryId === p.country!.id && !shortlisted.has(u.id))
    .slice(0, 3)
    .map((u, i) => ({
      id: u.id,
      name: u.name,
      city: u.city,
      rank: u.rank,
      tuition: `${u.tuition}/yr`,
      acceptance: u.acceptance,
      match: 93 - i * 3,
      initials: initialsOf(u.name),
    }))
}

export function buildDeadlines(p: OnboardingData, apps: Application[]): Deadline[] {
  const list: Deadline[] = []
  if (!p.englishTest || p.englishTest === 'Not taken yet') {
    list.push({ id: 'x-ielts', label: 'Book & take your English test', org: 'IELTS / TOEFL / PTE', date: '2026-09-15', type: 'exam' })
  }
  for (const a of apps) {
    list.push({ id: `x-${a.id}`, label: 'Application deadline', org: a.uniName, date: a.deadline!, type: 'application' })
  }
  list.push({ id: 'x-visa', label: 'Student visa filing window', org: 'Embassy / consulate', date: '2027-06-01', type: 'visa' })
  return list
}

export function buildTasks(p: OnboardingData, apps: Application[]): Task[] {
  const first = apps[0]
  const tasks: Task[] = [
    { id: 'rt1', label: first ? `Draft SOP — ${first.uniName}` : 'Draft your statement of purpose', due: '2026-08-10', tag: 'Writing', done: false },
    { id: 'rt2', label: 'Request 2 recommendation letters', due: '2026-08-20', tag: 'Recommendation', done: false },
    { id: 'rt3', label: 'Upload passport & transcripts', due: '2026-08-25', tag: 'Documents', done: false },
  ]
  if (!p.englishTest || p.englishTest === 'Not taken yet') {
    tasks.push({ id: 'rt4', label: 'Book IELTS / TOEFL', due: '2026-09-01', tag: 'Exam', done: false })
  }
  return tasks
}

export function buildNotifications(
  isDemo: boolean,
  student: StudentProfile,
  apps: Application[]
): Notice[] {
  if (isDemo) {
    return [
      { id: 'n1', kind: 'offer', title: 'Offer received — UCL', desc: 'Conditional offer for MSc Data Science & Machine Learning. Accept by Dec 10.', time: '2h ago', read: false },
      { id: 'n2', kind: 'deadline', title: 'Oxford SOP due in 3 days', desc: 'Your final draft is due on 24 Jul. Priya left feedback on v2.', time: '5h ago', read: false },
      { id: 'n3', kind: 'doc', title: 'Bank statement verified', desc: 'Meets the 28-day UKVI requirement.', time: 'Yesterday', read: false },
      { id: 'n4', kind: 'message', title: 'Priya sent you a message', desc: '“Imperial decisions are running ~2 weeks late…”', time: 'Yesterday', read: true },
    ]
  }
  const first = apps[0]
  return [
    { id: 'r1', kind: 'system', title: `Welcome to Mygreat, ${student.firstName}`, desc: 'Your account is ready — everything from onboarding was imported.', time: 'Just now', read: false },
    {
      id: 'r2',
      kind: 'doc',
      title: 'Shortlist saved',
      desc: apps.length > 0 ? `${apps.length} ${apps.length === 1 ? 'university' : 'universities'} added to your applications.` : 'You chose “not sure yet” — check your recommended matches.',
      time: 'Just now',
      read: false,
    },
    ...(first
      ? [{ id: 'r3', kind: 'deadline' as const, title: `${first.uniName} deadline ahead`, desc: 'Start early — a strong SOP takes 3–4 iterations.', time: 'Just now', read: false }]
      : []),
  ]
}
