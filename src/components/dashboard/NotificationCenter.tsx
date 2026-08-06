import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Search,
  FileText,
  CreditCard,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Inbox,
  AlertCircle,
  Clock,
  ExternalLink,
  Square,
  CheckSquare,
  ChevronDown,
  Trophy,
  CalendarClock,
  Sparkles,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from '@/lib/navigation'

export interface NotificationItem {
  id: string
  _id?: string
  title: string
  message?: string
  description?: string
  kind?: 'offer' | 'doc' | 'deadline' | 'message' | 'system' | string
  type?: string
  link?: string
  relatedId?: string
  isRead?: boolean
  read?: boolean
  createdAt?: string
  time?: string
}

interface NotificationCenterProps {
  notices: NotificationItem[]
  onMarkRead?: (id: string, isRead?: boolean) => void
  onMarkAll?: () => void
  onDelete?: (id: string) => void
  onClearAll?: () => void
  onRefresh?: () => void
  loading?: boolean
  totalCount?: number
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

const getRelativeTime = (dateStr?: string, defaultTime?: string) => {
  if (!dateStr) return defaultTime || 'Recently'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return defaultTime || 'Recently'
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (today.getTime() === notifDate.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  if (today.getTime() - notifDate.getTime() === 86400000) {
    return 'Yesterday'
  }

  if (now.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  application_submitted: { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
  application_approved: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  application_rejected: { icon: X, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
  payment_completed: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  payment_due: { icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  new_ticket: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  ticket_status_updated: { icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  offer: { icon: Trophy, color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/20' },
  doc: { icon: FileCheck, color: 'text-sky-300', bg: 'bg-sky-400/10 border-sky-400/20' },
  deadline: { icon: CalendarClock, color: 'text-rose-300', bg: 'bg-rose-400/10 border-rose-400/20' },
  message: { icon: MessageSquare, color: 'text-indigo-300', bg: 'bg-indigo-400/10 border-indigo-400/20' },
  system: { icon: Sparkles, color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/20' },
  default: { icon: Bell, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
}

const getTypeConfig = (type?: string, kind?: string) => {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type]
  if (kind && TYPE_CONFIG[kind]) return TYPE_CONFIG[kind]
  return TYPE_CONFIG.default
}

const TABS = [
  { id: 'all', label: 'Primary', icon: Inbox, color: 'text-amber-300', activeBg: 'bg-amber-400/10' },
  { id: 'unread', label: 'Unread', icon: AlertCircle, color: 'text-rose-400', activeBg: 'bg-rose-400/10' },
  { id: 'read', label: 'Read', icon: CheckCheck, color: 'text-emerald-400', activeBg: 'bg-emerald-400/10' },
] as const

const PAGE_LIMIT = 50

export default function NotificationCenter({
  notices,
  onMarkRead,
  onMarkAll,
  onDelete,
  onClearAll,
  onRefresh,
  loading = false,
  totalCount = notices.length,
  page = 1,
  totalPages = 1,
  onPageChange,
}: NotificationCenterProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeDetailNotif, setActiveDetailNotif] = useState<NotificationItem | null>(null)

  const unreadCount = useMemo(
    () => notices.filter((n) => !(n.isRead ?? n.read)).length,
    [notices]
  )

  const filteredItems = useMemo(() => {
    return notices.filter((item) => {
      const isItemRead = Boolean(item.isRead ?? item.read)
      if (activeTab === 'unread' && isItemRead) return false
      if (activeTab === 'read' && !isItemRead) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const text = `${item.title} ${item.message || item.description || ''}`.toLowerCase()
      return text.includes(q)
    })
  }, [notices, activeTab, searchQuery])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setSelectedIds([])
    if (onRefresh) await onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredItems.map((n) => n.id || n._id!))
    }
  }

  const handleBulkRead = () => {
    if (selectedIds.length === 0) return
    selectedIds.forEach((id) => onMarkRead?.(id, true))
    setSelectedIds([])
  }

  const handleBulkUnread = () => {
    if (selectedIds.length === 0) return
    selectedIds.forEach((id) => onMarkRead?.(id, false))
    setSelectedIds([])
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    selectedIds.forEach((id) => onDelete?.(id))
    setSelectedIds([])
  }

  const handleOpenDetail = (item: NotificationItem) => {
    setActiveDetailNotif(item)
    const isUnread = !(item.isRead ?? item.read)
    const itemId = item.id || item._id
    if (isUnread && itemId) {
      onMarkRead?.(itemId, true)
    }
  }

  const handleNavigateDetailLink = (item: NotificationItem) => {
    if (item.link) {
      router.push(item.link)
      setActiveDetailNotif(null)
    }
  }

  const selectedStats = useMemo(() => {
    const selected = filteredItems.filter((n) => selectedIds.includes(n.id || n._id!))
    return {
      hasRead: selected.some((n) => Boolean(n.isRead ?? n.read)),
      hasUnread: selected.some((n) => !Boolean(n.isRead ?? n.read)),
    }
  }, [selectedIds, filteredItems])

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-white">Notifications</h2>
          <p className="mt-1 text-xs sm:text-sm text-white/40">
            Review updates about documents, applications, deadlines, and support.
          </p>
        </div>
        {onMarkAll && notices.length > 0 && (
          <button
            onClick={onMarkAll}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-400/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors"
          >
            <CheckCheck className="size-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Main Gmail-Style Card Panel */}
      <div className="glass-panel rounded-3xl border border-white/[0.08] bg-[#070b18]/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Top Header Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
              title="Refresh notifications"
            >
              <RotateCcw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-amber-400')} />
            </button>
            {onClearAll && notices.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-xl hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-colors"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search notifications…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>
              {filteredItems.length > 0
                ? `${(page - 1) * PAGE_LIMIT + 1}-${Math.min(page * PAGE_LIMIT, totalCount)} of ${totalCount}`
                : '0 of 0'}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 text-white/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 text-white/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar & Multi-Select Status Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.015] border-b border-white/[0.06] min-h-[44px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handleSelectAll}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors"
                title="Select all"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredItems.length ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : selectedIds.length > 0 ? (
                  <div className="w-4 h-4 border border-amber-400 bg-amber-400/20 rounded flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-amber-400" />
                  </div>
                ) : (
                  <Square className="w-4 h-4 text-white/30" />
                )}
              </button>
              <ChevronDown className="w-3 h-3 text-white/30" />
            </div>

            {/* Bulk Action Controls */}
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1 pl-2 border-l border-white/10"
                >
                  {selectedStats.hasUnread && (
                    <button
                      onClick={handleBulkRead}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-emerald-400 transition-colors"
                      title="Mark selected as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {selectedStats.hasRead && (
                    <button
                      onClick={handleBulkUnread}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-amber-400 transition-colors"
                      title="Mark selected as unread"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleBulkDelete}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/60 hover:text-rose-400 transition-colors"
                    title="Delete selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-amber-300 ml-2">
                    {selectedIds.length} selected
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div className="flex border-b border-white/[0.07] bg-white/[0.01]">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2.5 px-6 py-3.5 text-xs font-bold transition-all relative outline-none',
                  isActive ? t.color : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                )}
              >
                <div className={cn('p-1 rounded-lg', isActive ? t.activeBg : 'bg-transparent')}>
                  <Icon className="w-4 h-4" />
                </div>
                {t.label}
                {t.id === 'unread' && unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">
                    {unreadCount}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Notifications Row List */}
        <div className="divide-y divide-white/[0.05] min-h-[300px]">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-4 h-4 bg-white/10 rounded" />
                  <div className="w-9 h-9 bg-white/10 rounded-xl" />
                  <div className="w-36 h-4 bg-white/10 rounded" />
                  <div className="flex-1 h-4 bg-white/10 rounded" />
                  <div className="w-16 h-3 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-sm font-semibold text-white/80">Your inbox is clear</h3>
              <p className="mt-1 text-xs text-white/35">No notifications match your current filter.</p>
            </div>
          ) : (
            filteredItems.map((notif) => {
              const notifId = notif.id || notif._id!
              const isUnread = !(notif.isRead ?? notif.read)
              const isSelected = selectedIds.includes(notifId)
              const config = getTypeConfig(notif.type, notif.kind)
              const IconComponent = config.icon

              return (
                <div
                  key={notifId}
                  onClick={() => handleOpenDetail(notif)}
                  className={cn(
                    'group relative flex items-center gap-3.5 px-4 py-3.5 transition-all cursor-pointer select-none',
                    isUnread
                      ? 'bg-amber-400/[0.03] hover:bg-amber-400/[0.06]'
                      : 'hover:bg-white/[0.025]',
                    isSelected && 'bg-amber-400/[0.08] shadow-[inset_2px_0_0_#f59e0b]'
                  )}
                >
                  {/* Multi-Select Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleSelect(notifId)
                    }}
                    className="p-1 rounded text-white/20 hover:text-white/60 transition-colors shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>

                  {/* Type Icon Badge */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                      config.bg
                    )}
                  >
                    <IconComponent className={cn('w-4 h-4', config.color)} />
                  </div>

                  {/* Title / Sender */}
                  <div className="w-32 sm:w-48 shrink-0 truncate">
                    <p className={cn('text-xs truncate', isUnread ? 'font-bold text-white' : 'font-medium text-white/70')}>
                      {notif.title}
                    </p>
                  </div>

                  {/* Message Snippet */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={cn('text-xs truncate', isUnread ? 'text-white/90 font-medium' : 'text-white/45')}>
                      {notif.message || notif.description}
                    </p>
                  </div>

                  {/* Hover Quick Actions */}
                  <div
                    className="hidden group-hover:flex items-center gap-1 shrink-0 bg-transparent absolute right-16 top-1/2 -translate-y-1/2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-0.5 bg-[#0a0f24]/90 backdrop-blur-md px-1.5 py-1 rounded-xl border border-white/10 shadow-lg">
                      <button
                        onClick={() => onMarkRead?.(notifId, !isUnread)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-amber-300 transition-colors"
                        title={isUnread ? 'Mark as read' : 'Mark as unread'}
                      >
                        {isUnread ? <Check className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(notifId)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/60 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {notif.link && (
                        <button
                          onClick={() => handleNavigateDetailLink(notif)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Time Stamp */}
                  <div className="group-hover:hidden shrink-0 text-[11px] font-medium text-white/35 text-right w-20">
                    {getRelativeTime(notif.createdAt, notif.time)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-2.5 border-t border-white/[0.07] bg-white/[0.015] flex justify-between items-center text-[11px] text-white/35 font-medium">
          <div className="flex items-center gap-4">
            <span className="text-amber-300/80 font-bold">{unreadCount} unread</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{totalCount} total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white/30" />
            <span>
              Last updated:{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Reader Modal */}
      <AnimatePresence>
        {activeDetailNotif && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDetailNotif(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-xl glass-panel rounded-3xl border border-white/15 bg-[#0b1124] p-6 sm:p-7 shadow-2xl shadow-black text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveDetailNotif(null)}
                className="absolute top-5 right-5 p-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Badge & Title */}
              {(() => {
                const config = getTypeConfig(activeDetailNotif.type, activeDetailNotif.kind)
                const IconComponent = config.icon
                const isUnread = !(activeDetailNotif.isRead ?? activeDetailNotif.read)

                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0', config.bg)}>
                        <IconComponent className={cn('w-5 h-5', config.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300/80">
                            {activeDetailNotif.type || activeDetailNotif.kind || 'Notification'}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-xs text-white/40">
                            {getRelativeTime(activeDetailNotif.createdAt, activeDetailNotif.time)}
                          </span>
                        </div>
                        <h3 className="font-display text-xl text-white mt-1 leading-snug">
                          {activeDetailNotif.title}
                        </h3>
                      </div>
                    </div>

                    {/* Detailed Message Body */}
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans max-h-[280px] overflow-y-auto scrollbar-thin">
                      {activeDetailNotif.message || activeDetailNotif.description || activeDetailNotif.title}
                    </div>

                    {/* Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const notifId = activeDetailNotif.id || activeDetailNotif._id!
                            const newStatus = !isUnread
                            onMarkRead?.(notifId, newStatus)
                            setActiveDetailNotif((prev) => (prev ? { ...prev, read: newStatus, isRead: newStatus } : null))
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white/80 transition-colors"
                        >
                          {isUnread ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                          {isUnread ? 'Mark as Read' : 'Mark as Unread'}
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => {
                              const notifId = activeDetailNotif.id || activeDetailNotif._id!
                              onDelete(notifId)
                              setActiveDetailNotif(null)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>

                      {activeDetailNotif.link ? (
                        <button
                          onClick={() => handleNavigateDetailLink(activeDetailNotif)}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-xs font-bold text-[#10172a] shadow-lg transition hover:-translate-y-0.5"
                        >
                          Take Action <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveDetailNotif(null)}
                          className="px-5 py-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 text-xs font-bold text-white transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
