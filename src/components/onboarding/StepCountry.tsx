import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Search, Check, MapPin } from 'lucide-react'
import type { Country } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  countries: Country[]
  selected: Country[]
  onSelect: (c: Country) => void
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
}

export default function StepCountry({ countries, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <p className="text-amber-400/90 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Step 01 — Destination</p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-light">
        Where do you want to <span className="text-gradient-gold font-medium">study?</span>
      </h2>
      <p className="text-white/50 mt-3 text-[15px]">Choose up to three countries that feel like your next home.</p>

      <div className="relative mt-7 mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search countries…"
          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5"
      >
        {filtered.map((c) => {
          const active = selected.some(({ id }) => id === c.id)
          const disabled = !active && selected.length >= 3
          return (
            <motion.button
              key={c.id}
              variants={item}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(c)}
              disabled={disabled}
              className={cn(
                'relative text-left rounded-2xl p-5 border transition-all duration-300 group overflow-hidden disabled:cursor-not-allowed disabled:opacity-45',
                active
                  ? 'bg-amber-400/[0.08] border-amber-400/70 shadow-[0_8px_40px_-8px_rgba(242,179,61,0.35)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
              )}
            >
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-[#0a0f24]" strokeWidth={3.2} />
                </motion.div>
              )}
              <span className="text-4xl block">{c.flag}</span>
              <p className={cn('font-semibold mt-3 text-[15px]', active ? 'text-amber-200' : 'text-white')}>{c.name}</p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">{c.tagline}</p>
              <div className="flex items-center gap-1.5 mt-3.5 text-[11px] text-white/35">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{c.cities.join(' · ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.07]">
                <span className="text-[11px] text-white/45">{c.universities} universities</span>
                <span className={cn('text-[11px] font-semibold', active ? 'text-amber-300' : 'text-white/60')}>{c.avgTuition}</span>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      <p className="mt-4 text-xs text-white/40">{selected.length}/3 countries selected</p>

      {filtered.length === 0 && (
        <p className="text-white/40 text-sm text-center py-14">No countries match “{query}”.</p>
      )}
    </div>
  )
}
