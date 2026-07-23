import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Check, Trophy, HelpCircle } from 'lucide-react'
import { UNIVERSITIES, MAX_UNIVERSITY_PICKS } from '@/data/onboarding'
import type { Country, University } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  country: Country
  selected: University[]
  notSure: boolean
  onToggle: (u: University) => void
  onNotSure: () => void
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
}

export default function StepUniversity({ country, selected, notSure, onToggle, onNotSure }: Props) {
  const [query, setQuery] = useState('')
  const list = UNIVERSITIES.filter(
    (u) => u.countryId === country.id && u.name.toLowerCase().includes(query.toLowerCase())
  )
  const full = selected.length >= MAX_UNIVERSITY_PICKS

  return (
    <div>
      <p className="text-amber-400/90 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Step 03 — Universities</p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-light">
        Pick your dream <span className="text-gradient-gold font-medium">universities.</span>
      </h2>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
        <p className="text-white/50 text-[15px]">
          Top picks in {country.flag} {country.name} — shortlist up to {MAX_UNIVERSITY_PICKS}.
        </p>
        <span
          className={cn(
            'text-[11px] font-semibold rounded-full px-2.5 py-1 border transition-colors',
            selected.length > 0 ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' : 'bg-white/5 text-white/40 border-white/10'
          )}
        >
          {selected.length} of {MAX_UNIVERSITY_PICKS} selected
        </span>
      </div>

      <div className="relative mt-6 mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search universities in ${country.name}…`}
          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {list.map((u) => {
            const active = selected.some((s) => s.id === u.id)
            const disabled = !active && (full || notSure)
            return (
              <motion.button
                layout
                key={u.id}
                variants={item}
                exit={{ opacity: 0, scale: 0.97 }}
                whileTap={disabled ? undefined : { scale: 0.99 }}
                onClick={() => !disabled && onToggle(u)}
                className={cn(
                  'w-full text-left rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex items-center gap-4',
                  active
                    ? 'bg-amber-400/[0.08] border-amber-400/70 shadow-[0_8px_40px_-10px_rgba(242,179,61,0.4)]'
                    : disabled
                      ? 'bg-white/[0.02] border-white/[0.06] opacity-45 cursor-not-allowed'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center font-display text-lg shrink-0 border',
                    active
                      ? 'bg-amber-400 text-[#0a0f24] border-amber-400 font-semibold'
                      : 'bg-white/[0.05] border-white/10 text-white/70'
                  )}
                >
                  {u.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('font-semibold text-[15px] truncate', active ? 'text-amber-100' : 'text-white')}>{u.name}</p>
                    {u.rank <= 50 && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {u.city} · Known for {u.knownFor}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-[11px] text-white/50">QS Rank <span className="text-white/80 font-semibold">#{u.rank}</span></span>
                    <span className="text-[11px] text-white/50">Tuition <span className="text-white/80 font-semibold">{u.tuition}/yr</span></span>
                    <span className="text-[11px] text-white/50">Acceptance <span className="text-white/80 font-semibold">{u.acceptance}</span></span>
                  </div>
                </div>

                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    active ? 'bg-amber-400 border-amber-400' : 'border-white/20'
                  )}
                >
                  {active && <Check className="w-3.5 h-3.5 text-[#0a0f24]" strokeWidth={3.2} />}
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>

        {list.length === 0 && (
          <p className="text-white/40 text-sm text-center py-12">No universities match “{query}”.</p>
        )}

        {/* Not sure option */}
        <motion.button
          variants={item}
          onClick={onNotSure}
          className={cn(
            'w-full text-left rounded-2xl p-4 border border-dashed transition-all duration-300 flex items-center gap-3.5',
            notSure
              ? 'bg-amber-400/[0.06] border-amber-400/60'
              : 'bg-transparent border-white/15 hover:border-white/30'
          )}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', notSure ? 'bg-amber-400/15' : 'bg-white/5')}>
            <HelpCircle className={cn('w-4.5 h-4.5', notSure ? 'text-amber-300' : 'text-white/40')} />
          </div>
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', notSure ? 'text-amber-200' : 'text-white/70')}>I'm not sure yet</p>
            <p className="text-xs text-white/35 mt-0.5">Let Mygreat recommend universities based on my profile.</p>
          </div>
          {notSure && <Check className="w-4 h-4 text-amber-400" strokeWidth={3} />}
        </motion.button>
      </motion.div>
    </div>
  )
}

