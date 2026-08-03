export type AppStatus = 'offer' | 'under-review' | 'submitted' | 'in-progress'
export type DocStatus = 'verified' | 'pending' | 'needed'
export type StageState = 'done' | 'current' | 'todo'

export interface Stage {
  label: string
  state: StageState
  date?: string
}

export interface Application {
  id: string
  uniName: string
  initials: string
  city: string
  program: string
  rank: number
  status: AppStatus
  progress: number
  nextAction: string
  deadline?: string
  deadlineLabel?: string
  stages: Stage[]
  visaStatus?: 'not-started' | 'documents-pending' | 'ready-to-file' | 'filed' | 'approved' | 'rejected'
}

export interface Task {
  id: string
  label: string
  due?: string
  tag: string
  done: boolean
}

export interface DocItem {
  id: string
  name: string
  status: DocStatus
  note: string
}

export interface Deadline {
  id: string
  label: string
  org: string
  date: string
  type: 'application' | 'exam' | 'deposit' | 'housing' | 'visa' | 'task'
}

export interface StudentProfile {
  name: string
  firstName: string
  initials: string
  target: string
  country: string
  flag: string
  intake: string
  gpa: number
  profileComplete: number
  journeyStep: number
}

export type NoticeKind = 'offer' | 'doc' | 'deadline' | 'message' | 'system'

export interface Notice {
  id: string
  kind: NoticeKind
  title: string
  desc: string
  time: string
  read: boolean
}

export const STUDENT: StudentProfile = {
  name: 'Aarav Mehta',
  firstName: 'Aarav',
  initials: 'AM',
  target: 'MSc Data Science & AI',
  country: 'United Kingdom',
  flag: '🇬🇧',
  intake: 'Fall 2027',
  gpa: 3.7,
  profileComplete: 80,
  journeyStep: 2, // 0-based index into JOURNEY
}

export const JOURNEY = ['Profile', 'Shortlist', 'Upload docs', 'Applications', 'Visa', 'Enroll']

export const APPLICATIONS: Application[] = [
  {
    id: 'ucl',
    uniName: 'UCL',
    initials: 'UC',
    city: 'London',
    program: 'MSc Data Science & Machine Learning',
    rank: 9,
    status: 'offer',
    progress: 100,
    nextAction: 'Accept your offer',
    deadline: '2026-12-10',
    deadlineLabel: 'Deposit deadline',
    stages: [
      { label: 'Submitted', state: 'done', date: 'Jun 30' },
      { label: 'Under review', state: 'done', date: 'Jul 12' },
      { label: 'Decision · Offer', state: 'done', date: 'Jul 18' },
    ],
  },
  {
    id: 'imperial',
    uniName: 'Imperial College London',
    initials: 'IC',
    city: 'London',
    program: 'MSc Artificial Intelligence & ML',
    rank: 6,
    status: 'under-review',
    progress: 70,
    nextAction: 'Awaiting decision — expected mid-August',
    stages: [
      { label: 'Submitted', state: 'done', date: 'Jul 2' },
      { label: 'Under review', state: 'current' },
      { label: 'Decision', state: 'todo' },
    ],
  },
  {
    id: 'oxford',
    uniName: 'University of Oxford',
    initials: 'Ox',
    city: 'Oxford',
    program: 'MSc Advanced Computer Science',
    rank: 3,
    status: 'in-progress',
    progress: 65,
    nextAction: 'Upload your final SOP',
    deadline: '2027-01-14',
    deadlineLabel: 'Application deadline',
    stages: [
      { label: 'Application', state: 'current' },
      { label: 'Submit', state: 'todo' },
      { label: 'Review', state: 'todo' },
    ],
  },
]

export const TASKS: Task[] = [
  { id: 't1', label: 'Final SOP draft — Oxford', due: '2026-07-24', tag: 'Writing', done: false },
  { id: 't2', label: 'Request LOR from Prof. Iyer', due: '2026-07-26', tag: 'Recommendation', done: false },
  { id: 't3', label: 'Book IELTS slot', due: '2026-08-02', tag: 'Exam', done: false },
  { id: 't4', label: 'Scan financial documents', due: '2026-08-05', tag: 'Documents', done: false },
  { id: 't5', label: 'Update CV to 2 pages', tag: 'Documents', done: true },
]

export const DOCUMENTS: DocItem[] = [
  { id: 'd1', name: 'Passport', status: 'verified', note: 'Valid until 2032' },
  { id: 'd2', name: 'Passport photo', status: 'verified', note: 'Meets UKVI spec' },
  { id: 'd3', name: 'Academic transcripts', status: 'verified', note: 'All 6 semesters' },
  { id: 'd4', name: 'Degree certificate', status: 'verified', note: 'Provisional accepted' },
  { id: 'd5', name: 'CV / Résumé', status: 'verified', note: '2 pages · v4' },
  { id: 'd6', name: 'Bank statement', status: 'verified', note: '28-day rule met' },
  { id: 'd7', name: 'SOP — UCL', status: 'verified', note: 'Submitted with application' },
  { id: 'd8', name: 'SOP — Oxford', status: 'pending', note: 'Counsellor reviewing v2' },
  { id: 'd9', name: 'LOR — Prof. Iyer', status: 'needed', note: 'Requested · awaiting upload' },
  { id: 'd10', name: 'IELTS score report', status: 'needed', note: 'Exam on Aug 15' },
]

export const DEADLINES: Deadline[] = [
  { id: 'dl1', label: 'Final SOP draft', org: 'University of Oxford', date: '2026-07-24', type: 'task' },
  { id: 'dl2', label: 'IELTS Academic exam', org: 'IDP Test Centre', date: '2026-08-15', type: 'exam' },
  { id: 'dl3', label: 'Accept offer + pay deposit', org: 'UCL', date: '2026-12-10', type: 'deposit' },
  { id: 'dl4', label: 'Application deadline', org: 'University of Oxford', date: '2027-01-14', type: 'application' },
  { id: 'dl5', label: 'Regular decision deadline', org: 'Imperial College London', date: '2027-03-26', type: 'application' },
  { id: 'dl6', label: 'Accommodation application', org: 'UCL', date: '2027-04-30', type: 'housing' },
  { id: 'dl7', label: 'CAS + student visa filing', org: 'UK Visas & Immigration', date: '2027-05-15', type: 'visa' },
]

export interface Reco {
  id: string
  name: string
  city: string
  rank: number
  tuition: string
  acceptance: string
  match: number
  initials: string
}

export const RECOMMENDATIONS: Reco[] = [
  { id: 'cambridge', name: 'University of Cambridge', city: 'Cambridge', rank: 2, tuition: '£35,000/yr', acceptance: '18%', match: 94, initials: 'Ca' },
  { id: 'edinburgh', name: 'University of Edinburgh', city: 'Edinburgh', rank: 22, tuition: '£28,950/yr', acceptance: '33%', match: 91, initials: 'Ed' },
]

export interface ChatMessage {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
}

export interface Conversation {
  id: string
  name: string
  role: string
  initials: string
  preview: string
  unread: number
  messages: ChatMessage[]
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'priya',
    name: 'Priya Nair',
    role: 'Senior counsellor',
    initials: 'PN',
    preview: 'Imperial decisions are running ~2 weeks late…',
    unread: 2,
    messages: [
      { id: 'm1', from: 'them', text: 'Hi Aarav! I reviewed your Oxford SOP draft — strong opening. Let’s sharpen the research paragraph a bit.', time: '10:24' },
      { id: 'm2', from: 'me', text: 'Thanks Priya! I’ll send v2 by tomorrow morning.', time: '10:31' },
      { id: 'm3', from: 'them', text: 'Perfect. Also — Imperial decisions are running about two weeks late this cycle, so no stress on the silence.', time: '10:32' },
      { id: 'm4', from: 'them', text: 'And congrats again on the UCL offer 🎉', time: '10:32' },
    ],
  },
  {
    id: 'support',
    name: 'Mygreat Support',
    role: 'Document team',
    initials: 'MG',
    preview: 'Your bank statement was verified',
    unread: 0,
    messages: [
      { id: 's1', from: 'them', text: 'Your bank statement was verified and meets the 28-day UKVI requirement.', time: 'Mon' },
    ],
  },
]

export const ADVISOR = {
  name: 'Priya Nair',
  role: 'Senior counsellor · UK & Ireland',
  initials: 'PN',
  nextSlot: 'Tomorrow · 4:30 PM',
}

export function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso + 'T00:00:00')
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
