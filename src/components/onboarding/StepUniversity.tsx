import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Check, Trophy, HelpCircle, ChevronLeft, ChevronRight, GitCompareArrows } from 'lucide-react'
import { MAX_UNIVERSITY_PICKS } from '@/data/onboarding'
import type { Country, OnboardingCourseOption, University } from '@/types'
import { CourseComparisonModal } from './StepEducation'
import { getOnboardingCourseDetailsFn } from '@/features/onboarding/onboarding.functions'
import { cn } from '@/lib/utils'

interface Props {
  country: Country
  countries: Country[]
  fields: string[]
  degree: string
  universities: University[]
  selected: University[]
  notSure: boolean
  onToggle: (u: University) => void
  onNotSure: () => void
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.015 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
}

export default function StepUniversity({ country, countries, fields, degree, universities, selected, notSure, onToggle, onNotSure }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [compareOpen, setCompareOpen] = useState(false)
  const [comparisonCourses, setComparisonCourses] = useState<OnboardingCourseOption[]>([])
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const pageSize = 10
  const list = universities.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize))
  const visible = list.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [country.id, query])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])
  const full = selected.length >= MAX_UNIVERSITY_PICKS
  const openComparison=async()=>{setComparisonLoading(true);try{setComparisonCourses(await getOnboardingCourseDetailsFn({data:{countryIds:countries.map(item=>item.id),names:fields,level:degree,universityIds:selected.map(item=>item.id)}}));setCompareOpen(true)}catch{setComparisonCourses([]);setCompareOpen(true)}finally{setComparisonLoading(false)}}

  return (
    <div>
      <p className="text-amber-400/90 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Step 03 — Universities</p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-light">
        Pick your dream <span className="text-gradient-gold font-medium">universities.</span>
      </h2>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
        <p className="text-white/50 text-[15px]">
          Universities in your selected destinations offering your selected courses — shortlist up to {MAX_UNIVERSITY_PICKS}.
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

      {selected.length>0&&fields.length>0&&<button type="button" disabled={comparisonLoading} onClick={openComparison} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-400/[.07] px-5 py-3.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/[.12] disabled:cursor-wait disabled:opacity-60"><GitCompareArrows className="size-4"/>{comparisonLoading?'Loading comparison…':'Compare selected courses and universities'}</button>}

      {compareOpen&&<CourseComparisonModal fields={fields} degree={degree} courses={comparisonCourses} countries={countries} universityIds={selected.map(university=>university.id)} onClose={()=>setCompareOpen(false)}/>}

      <motion.button
        variants={item}
        onClick={onNotSure}
        className={cn(
          'mt-6 w-full text-left rounded-2xl p-4 border border-dashed transition-all duration-300 flex items-center gap-3.5',
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

      <div className="relative mt-4 mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search eligible universities…"
          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((u) => {
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
                    {u.rank > 0 && u.rank <= 50 && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">
                    {u.city || 'Location not specified'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-[11px] text-white/50">Courses <span className="text-white/80 font-semibold">{u.courseCount?.toLocaleString() ?? 0}</span></span>
                    {u.rank > 0 && <span className="text-[11px] text-white/50">Rank <span className="text-white/80 font-semibold">#{u.rank}</span></span>}
                    {u.website && <span className="text-[11px] text-white/50">Website available</span>}
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

        {list.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-[11px] text-white/40">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, list.length)} of {list.length} universities</p>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button type="button" aria-label="Previous university page" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/55 transition hover:border-amber-400/35 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="size-4" /></button>
              <span className="min-w-20 text-center text-[11px] font-semibold text-white/55">Page {page} of {pageCount}</span>
              <button type="button" aria-label="Next university page" disabled={page === pageCount} onClick={() => setPage(value => value + 1)} className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/55 transition hover:border-amber-400/35 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"><ChevronRight className="size-4" /></button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}
