import { motion } from 'framer-motion'
import { Trophy, FileCheck, CalendarClock, MessageSquare, Sparkles, CheckCheck, ExternalLink, Bell, ArrowRight } from 'lucide-react'
import type { Notice, NoticeKind } from '@/data/dashboard'
import { cn } from '@/lib/utils'
import { useRouter } from '@/lib/navigation'

export interface ExtendedNotificationItem {
  id: string
  _id?: string
  title: string
  desc?: string
  description?: string
  message?: string
  kind?: NoticeKind | string
  type?: string
  time?: string
  createdAt?: string
  read?: boolean
  isRead?: boolean
  link?: string
}

const KIND_META: Record<string, { icon: React.ElementType; cls: string }> = {
  offer: { icon: Trophy, cls: 'bg-emerald-400/12 text-emerald-300 border-emerald-400/25' },
  doc: { icon: FileCheck, cls: 'bg-sky-400/12 text-sky-300 border-sky-400/25' },
  deadline: { icon: CalendarClock, cls: 'bg-amber-400/12 text-amber-300 border-amber-400/25' },
  message: { icon: MessageSquare, cls: 'bg-violet-400/12 text-violet-300 border-violet-400/25' },
  system: { icon: Sparkles, cls: 'bg-amber-400/12 text-amber-300 border-amber-400/25' },
  application_submitted: { icon: FileCheck, cls: 'bg-sky-400/12 text-sky-300 border-sky-400/25' },
  payment_completed: { icon: Trophy, cls: 'bg-emerald-400/12 text-emerald-300 border-emerald-400/25' },
  default: { icon: Bell, cls: 'bg-amber-400/12 text-amber-300 border-amber-400/25' },
}

const getMeta = (kind?: string, type?: string) => {
  if (kind && KIND_META[kind]) return KIND_META[kind]
  if (type && KIND_META[type]) return KIND_META[type]
  return KIND_META.default
}

interface Props {
  notices: (Notice | ExtendedNotificationItem)[]
  onMarkAll: () => void
  onClose: () => void
  onItemClick?: (item: any) => void
  onOpenManagement?: () => void
}

export default function Notifications({ notices, onMarkAll, onClose, onItemClick, onOpenManagement }: Props) {
  const router = useRouter()

  const handleItemClick = (n: Notice | ExtendedNotificationItem) => {
    if (onItemClick) {
      onItemClick(n)
    }
    if ('link' in n && n.link) {
      router.push(n.link)
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="absolute right-0 top-12 z-[110] w-[min(92vw,390px)] rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 bg-[#0a0f24] text-white backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] bg-[#0a0f24]/90">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[14px] text-white">Notifications</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
              {notices.filter((n) => !('isRead' in n ? n.isRead : n.read)).length} unread
            </span>
          </div>
          <button
            onClick={onMarkAll}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-amber-300/90 hover:text-amber-200 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
        <div className="max-h-[380px] overflow-y-auto scrollbar-thin divide-y divide-white/[0.05]">
          {notices.map((n) => {
            const isRead = 'isRead' in n ? Boolean(n.isRead) : Boolean(n.read)
            const title = n.title
            const desc = 'desc' in n ? n.desc : n.description || n.message
            const time = 'time' in n ? n.time : 'Recently'
            const m = getMeta(n.kind, 'type' in n ? n.type : undefined)
            const Icon = m.icon

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={cn(
                  'group flex items-start gap-3.5 px-5 py-4 transition-colors cursor-pointer',
                  !isRead ? 'bg-amber-400/[0.035] hover:bg-amber-400/[0.07]' : 'hover:bg-white/[0.02]'
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', m.cls)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-[13px] leading-snug truncate', !isRead ? 'font-bold text-white' : 'font-medium text-white/75')}>
                      {title}
                    </p>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11.5px] text-white/40 leading-relaxed mt-1 line-clamp-2">{desc}</p>
                  <div className="flex items-center justify-between mt-2 text-[10.5px] text-white/25">
                    <span>{time}</span>
                    {'link' in n && n.link && (
                      <span className="inline-flex items-center gap-1 text-amber-300/80 group-hover:text-amber-200 font-semibold">
                        View <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {notices.length === 0 && (
            <div className="py-12 text-center">
              <Bell className="w-7 h-7 text-white/20 mx-auto" />
              <p className="text-center text-white/35 text-xs mt-2">You're all caught up.</p>
            </div>
          )}
        </div>
        {onOpenManagement && (
          <div className="p-3 border-t border-white/[0.07] bg-[#0a0f24]/90 text-center">
            <button
              onClick={() => {
                onOpenManagement()
                onClose()
              }}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              Open Notifications Management <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
