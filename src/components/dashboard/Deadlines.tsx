import { motion } from 'framer-motion'
import { Send, PenLine, Landmark, Home, Plane, ClipboardList } from 'lucide-react'
import { daysUntil, fmtDate, type Deadline } from '@/data/dashboard'
import { Panel, fadeUp } from './bits'
import { cn } from '@/lib/utils'

const TYPE_META: Record<Deadline['type'], { label: string; icon: React.ElementType; cls: string }> = {
  application: { label: 'Application', icon: Send, cls: 'text-amber-300 bg-amber-400/10 border-amber-400/30' },
  exam: { label: 'Exam', icon: PenLine, cls: 'text-sky-300 bg-sky-400/10 border-sky-400/30' },
  deposit: { label: 'Deposit', icon: Landmark, cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30' },
  housing: { label: 'Housing', icon: Home, cls: 'text-violet-300 bg-violet-400/10 border-violet-400/30' },
  visa: { label: 'Visa', icon: Plane, cls: 'text-rose-300 bg-rose-400/10 border-rose-400/30' },
  task: { label: 'Task', icon: ClipboardList, cls: 'text-white/60 bg-white/[0.06] border-white/15' },
}

function monthKey(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function Deadlines({ deadlines }: { deadlines: Deadline[] }) {
  const sorted = [...deadlines].sort((a, b) => a.date.localeCompare(b.date))
  const groups: { month: string; items: Deadline[] }[] = []
  for (const d of sorted) {
    const m = monthKey(d.date)
    const g = groups.find((x) => x.month === m)
    if (g) g.items.push(d)
    else groups.push({ month: m, items: [d] })
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h2 className="font-display text-2xl sm:text-3xl font-light">
          Deadline <span className="text-gradient-gold font-medium">timeline</span>
        </h2>
        <p className="text-white/45 text-sm mt-1.5">Every date that matters, in order — we'll nudge you before each one.</p>
      </motion.div>

      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.08]" />
        {groups.map((g, gi) => (
          <motion.div key={g.month} variants={fadeUp} initial="hidden" animate="show" custom={1 + gi} className="relative mb-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-300/80 font-semibold mb-3.5 pl-12">{g.month}</p>
            <div className="space-y-3">
              {g.items.map((d) => {
                const m = TYPE_META[d.type]
                const days = daysUntil(d.date)
                return (
                  <div key={d.id} className="relative pl-12">
                    <div className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full border flex items-center justify-center bg-[#0a0f24]', m.cls)}>
                      <m.icon className="w-3.5 h-3.5" />
                    </div>
                    <Panel className="px-4.5 sm:px-5 py-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[14px] leading-snug">{d.label}</p>
                        <p className="text-[11.5px] text-white/40 mt-1">{d.org}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold">{fmtDate(d.date)}</p>
                        <p className={cn('text-[11px] font-medium mt-0.5', days <= 30 ? 'text-amber-300' : 'text-white/35')}>
                          {days === 0 ? 'Today' : `${days} days left`}
                        </p>
                      </div>
                    </Panel>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

