import { motion } from 'framer-motion'
import { Trophy, FileCheck, CalendarClock, MessageSquare, Sparkles, CheckCheck } from 'lucide-react'
import type { Notice, NoticeKind } from '@/data/dashboard'
import { cn } from '@/lib/utils'

const KIND_META: Record<NoticeKind, { icon: React.ElementType; cls: string }> = {
  offer: { icon: Trophy, cls: 'bg-emerald-400/12 text-emerald-300 border-emerald-400/25' },
  doc: { icon: FileCheck, cls: 'bg-sky-400/12 text-sky-300 border-sky-400/25' },
  deadline: { icon: CalendarClock, cls: 'bg-amber-400/12 text-amber-300 border-amber-400/25' },
  message: { icon: MessageSquare, cls: 'bg-violet-400/12 text-violet-300 border-violet-400/25' },
  system: { icon: Sparkles, cls: 'bg-amber-400/12 text-amber-300 border-amber-400/25' },
}

interface Props {
  notices: Notice[]
  onMarkAll: () => void
  onClose: () => void
}

export default function Notifications({ notices, onMarkAll, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="absolute right-0 top-12 z-40 w-[min(92vw,380px)] glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] bg-[#0a0f24]/80">
          <p className="font-semibold text-[14px]">Notifications</p>
          <button
            onClick={onMarkAll}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-amber-300/90 hover:text-amber-200 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
        <div className="max-h-[380px] overflow-y-auto scrollbar-thin bg-[#0a0f24]/80">
          {notices.map((n) => {
            const m = KIND_META[n.kind]
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3.5 px-5 py-4 border-b border-white/[0.05] last:border-0 transition-colors',
                  !n.read && 'bg-amber-400/[0.03]'
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', m.cls)}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-[13px] leading-snug', !n.read ? 'font-semibold' : 'font-medium text-white/75')}>{n.title}</p>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11.5px] text-white/40 leading-relaxed mt-1">{n.desc}</p>
                  <p className="text-[10.5px] text-white/25 mt-1.5">{n.time}</p>
                </div>
              </div>
            )
          })}
          {notices.length === 0 && (
            <p className="text-center text-white/35 text-sm py-10">You're all caught up.</p>
          )}
        </div>
      </motion.div>
    </>
  )
}

