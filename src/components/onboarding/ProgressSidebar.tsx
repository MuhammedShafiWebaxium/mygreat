'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Compass, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Destination', desc: 'Pick your country' },
  { label: 'Academics', desc: 'Your education story' },
  { label: 'Universities', desc: 'Shortlist your picks' },
  { label: 'Sign up', desc: 'Create your account' },
]

interface Props {
  step: number
  compact?: boolean
}

export default function ProgressSidebar({ step, compact = false }: Props) {
  if (compact) {
    return (
      <div className="lg:hidden relative z-10 px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Back to Mygreat home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Compass className="w-5 h-5 text-[#0a0f24]" strokeWidth={2.4} />
            </div>
            <span className="font-display text-xl tracking-tight">Mygreat</span>
          </Link>
          <span className="text-xs font-medium text-white/50 tracking-wide">
            STEP {Math.min(step + 1, 4)} OF 4
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500"
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden lg:flex relative flex-col justify-between w-[400px] xl:w-[440px] shrink-0 h-full border-r border-white/5 p-10 overflow-hidden noise">
      {/* aurora blobs */}
      <div className="aurora w-[420px] h-[420px] -top-32 -left-40 bg-indigo-600/25" />
      <div className="aurora w-[360px] h-[360px] bottom-0 -right-32 bg-amber-500/12" />

      <div className="relative z-10">
        <Link href="/" className="flex w-fit items-center gap-3" aria-label="Back to Mygreat home">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Compass className="w-6 h-6 text-[#0a0f24]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-2xl tracking-tight leading-none">Mygreat</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40 mt-1">Study Abroad</p>
          </div>
        </Link>

        <h1 className="font-display text-[2.6rem] leading-[1.12] mt-14 font-light">
          The world is<br />
          <span className="text-gradient-gold font-medium">your campus.</span>
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mt-4 max-w-[300px]">
          Three quick steps and we'll match you with universities that fit your story.
        </p>
      </div>

      <div className="relative z-10 space-y-1">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s.label} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[19px] top-[42px] w-px h-[calc(100%-40px)] bg-white/10">
                  <motion.div
                    className="w-full bg-gradient-to-b from-amber-300 to-amber-500 origin-top"
                    animate={{ height: done ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
              <div
                className={cn(
                  'relative flex items-center gap-4 py-3.5 px-3 -mx-3 rounded-2xl transition-colors duration-300',
                  active && 'bg-white/[0.04]'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border transition-all duration-300 shrink-0',
                    done
                      ? 'bg-amber-400 border-amber-400 text-[#0a0f24]'
                      : active
                        ? 'border-amber-400/70 text-amber-300 shadow-[0_0_0_4px_rgba(242,179,61,0.12)]'
                        : 'border-white/15 text-white/35'
                  )}
                >
                  {done ? <Check className="w-4.5 h-4.5" strokeWidth={3} /> : `0${i + 1}`}
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', active ? 'text-white' : done ? 'text-white/80' : 'text-white/35')}>
                    {s.label}
                  </p>
                  <p className={cn('text-xs mt-0.5', active ? 'text-white/50' : 'text-white/25')}>{s.desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative z-10 glass-panel rounded-2xl p-5">
        <p className="text-[13px] leading-relaxed text-white/60 italic">
          "Mygreat turned a scary process into a ten-minute conversation. I'm now at TU Delft."
        </p>
        <div className="flex items-center gap-3 mt-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-[11px] font-bold">
            AR
          </div>
          <div>
            <p className="text-xs font-semibold">Ananya Rao</p>
            <p className="text-[11px] text-white/40">MSc Aerospace, Class of '27</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
