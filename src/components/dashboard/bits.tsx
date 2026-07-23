import { useId } from 'react'
import { motion } from 'framer-motion'
import type { AppStatus } from '@/data/dashboard'
import { cn } from '@/lib/utils'

export const STATUS_META: Record<AppStatus, { label: string; chip: string; dot: string }> = {
  offer: { label: 'Offer received', chip: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30', dot: 'bg-emerald-400' },
  'under-review': { label: 'Under review', chip: 'bg-sky-400/10 text-sky-300 border-sky-400/30', dot: 'bg-sky-400' },
  submitted: { label: 'Submitted', chip: 'bg-violet-400/10 text-violet-300 border-violet-400/30', dot: 'bg-violet-400' },
  'in-progress': { label: 'In progress', chip: 'bg-amber-400/10 text-amber-300 border-amber-400/30', dot: 'bg-amber-400' },
}

export function StatusChip({ status, className }: { status: AppStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border', m.chip, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('glass-panel rounded-3xl', className)}>{children}</div>
}

export function PanelTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">{children}</p>
      {right}
    </div>
  )
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 rounded-full bg-white/[0.08] overflow-hidden', className)}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 92,
  stroke = 8,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center font-bold text-white', className)}>
      {initials}
    </div>
  )
}

export function UniMark({ initials, active = false, size = 'md' }: { initials: string; active?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-display shrink-0 border',
        size === 'lg' ? 'w-13 h-13 text-xl' : 'w-11 h-11 text-base',
        active
          ? 'bg-amber-400 text-[#0a0f24] border-amber-400 font-semibold'
          : 'bg-white/[0.05] border-white/10 text-white/75'
      )}
    >
      {initials}
    </div>
  )
}

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, type: 'spring' as const, stiffness: 150, damping: 20 },
  }),
}

