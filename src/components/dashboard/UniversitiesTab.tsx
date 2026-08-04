import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, CheckCircle2, Compass, GitCompareArrows, MapPin, Sparkles, Trophy, X } from 'lucide-react'
import type { Reco, StudentProfile } from '@/data/dashboard'
import type { University } from '@/types'
import { cn } from '@/lib/utils'
import { Panel, PanelTitle, UniMark, fadeUp } from './bits'

interface Props {
  student: StudentProfile
  shortlisted: University[]
  recommendations: Reco[]
  onShortlistToggle: (university: University) => Promise<void>
}

interface ComparisonUniversity {
  id: string
  name: string
  city: string
  rank: number
  tuition: string
  acceptance: string
  knownFor: string
  shortlisted: boolean
  university: University
}

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()

export default function UniversitiesTab({ student, shortlisted, recommendations, onShortlistToggle }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [savingId, setSavingId] = useState('')
  const universities = useMemo<ComparisonUniversity[]>(() => {
    const shortlistedIds = new Set(shortlisted.map((item) => item.id))
    const rows: ComparisonUniversity[] = shortlisted.map((item) => ({
      id: item.id, name: item.name, city: item.city, rank: item.rank, tuition: item.tuition,
      acceptance: item.acceptance || 'Not published', knownFor: item.knownFor || 'Not published', shortlisted: true, university: item,
    }))
    recommendations.forEach((item) => {
      if (!rows.some((row) => row.id === item.id)) rows.push({
        id: item.id, name: item.name, city: item.city, rank: item.rank, tuition: item.tuition,
        acceptance: item.acceptance, knownFor: item.knownFor || student.target, shortlisted: shortlistedIds.has(item.id),
        university: { id: item.id, name: item.name, city: item.city, countryId: item.countryId || '', rank: item.rank, tuition: item.tuition, acceptance: item.acceptance, knownFor: item.knownFor || student.target },
      })
    })
    return rows
  }, [recommendations, shortlisted, student.target])
  const selected = selectedIds.map((id) => universities.find((item) => item.id === id)).filter(Boolean) as ComparisonUniversity[]
  const toggleComparison = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current)
  const toggleShortlist = async (university: ComparisonUniversity) => {
    try { setSavingId(university.id); await onShortlistToggle(university.university) }
    finally { setSavingId('') }
  }

  return <div className="max-w-5xl space-y-5">
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="font-display text-2xl font-light sm:text-3xl">Discover <span className="text-gradient-gold font-medium">universities</span></h2><p className="mt-1.5 text-sm text-white/45">Universities in {student.country || 'your selected country'} offering {student.target || 'your selected course'}. Shortlist up to three, or compare before deciding.</p></div>
      {selected.length > 0 && <span className="text-xs text-amber-300">{selected.length}/3 selected</span>}
    </motion.div>

    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}><Panel>
      <PanelTitle>Shortlist · {shortlisted.length}</PanelTitle>
      {shortlisted.length ? <div className="grid gap-3 px-4 pb-5 sm:px-5 md:grid-cols-3">{shortlisted.map((university) => <UniversityCard key={university.id} university={universities.find((item) => item.id === university.id)!} selected={selectedIds.includes(university.id)} disabled={selectedIds.length === 3 && !selectedIds.includes(university.id)} saving={savingId === university.id} onToggle={() => toggleComparison(university.id)} onShortlist={() => toggleShortlist(universities.find((item) => item.id === university.id)!)} />)}</div> : <div className="mx-4 mb-5 rounded-2xl border border-dashed border-amber-400/25 bg-amber-400/[.04] p-6 text-center sm:mx-5"><p className="text-[13.5px] font-semibold">Choose your first university</p><p className="mt-1 text-[11.5px] text-white/45">You skipped this during onboarding. Select up to three eligible universities below to complete your shortlist.</p></div>}
    </Panel></motion.div>

    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}><Panel>
      <PanelTitle right={<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40"><Sparkles className="size-3.5 text-amber-400/80" /> Based on GPA {student.gpa.toFixed(1)} · {student.target}</span>}>Recommended matches</PanelTitle>
      <div className="grid gap-3 px-4 pb-5 sm:px-5 md:grid-cols-3">{recommendations.map((recommendation) => {
        const university = universities.find((item) => item.id === recommendation.id)!
        return <UniversityCard key={recommendation.id} university={university} selected={selectedIds.includes(recommendation.id)} disabled={selectedIds.length === 3 && !selectedIds.includes(recommendation.id)} saving={savingId === recommendation.id} onToggle={() => toggleComparison(recommendation.id)} onShortlist={() => toggleShortlist(university)} recommended />
      })}<button className="group flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-4.5 text-center transition-all hover:border-amber-400/40 hover:bg-amber-400/[0.02]"><div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] transition-colors group-hover:border-amber-400/40"><Compass className="size-5 text-white/50 transition-colors group-hover:text-amber-300" /></div><p className="mt-3.5 text-[14px] font-semibold">Explore more universities</p><p className="mt-1 text-[11.5px] text-white/35">Filter by course, budget &amp; city</p></button></div>
    </Panel></motion.div>

    {selected.length > 0 && <div className="university-compare-tray sticky bottom-4 z-30 rounded-2xl border border-amber-300/25 bg-[#0b1122]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">{selected.map((item) => <span key={item.id} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-[11px] font-semibold"><UniMark initials={initialsOf(item.name)} /><span className="max-w-36 truncate">{item.name}</span><button onClick={() => toggleComparison(item.id)} aria-label={`Remove ${item.name}`} className="text-white/35 hover:text-rose-300"><X className="size-3.5" /></button></span>)}</div>
      <div className="mt-3 flex items-center gap-2 sm:mt-0"><button onClick={() => setSelectedIds([])} className="px-3 py-2 text-[11px] text-white/45 hover:text-white">Clear</button><button disabled={selected.length < 2} onClick={() => setComparisonOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"><GitCompareArrows className="size-4" />Compare {selected.length > 1 ? selected.length : ''}</button></div>
    </div>}
    {comparisonOpen && <ComparisonModal universities={selected} onClose={() => setComparisonOpen(false)} onRemove={toggleComparison} />}
  </div>
}

function UniversityCard({ university, selected, disabled, saving, onToggle, onShortlist, recommended = false }: { university: ComparisonUniversity; selected: boolean; disabled: boolean; saving: boolean; onToggle: () => void; onShortlist: () => void; recommended?: boolean }) {
  return <article className={cn('flex flex-col rounded-2xl border p-4.5 transition-all', selected ? 'border-amber-400/50 bg-amber-400/[.07] ring-1 ring-amber-400/20' : 'border-white/[0.07] bg-white/[0.02] hover:border-amber-400/30')}>
    <div className="flex items-start gap-3"><UniMark initials={initialsOf(university.name)} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-[14px] font-semibold">{university.name}</p>{recommended && university.rank <= 5 && <Trophy className="size-3.5 shrink-0 text-amber-400" />}</div><p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/40"><MapPin className="size-3" />{university.city} · QS #{university.rank}</p></div></div>
    <p className="mt-3 flex-1 text-[12px] leading-snug text-white/45">{university.knownFor}</p>
    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10.5px]"><span className="text-white/40">{university.tuition}/yr</span>{university.shortlisted && <span className="inline-flex items-center gap-1 font-semibold text-emerald-300"><CheckCircle2 className="size-3" />Shortlisted</span>}</div>
    <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={onShortlist} className={cn('inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold transition', university.shortlisted ? 'border border-rose-400/20 text-rose-300 hover:bg-rose-400/10' : 'bg-amber-400 text-slate-950 hover:bg-amber-300', saving && 'opacity-40')}>{saving ? 'Saving…' : university.shortlisted ? 'Remove' : 'Shortlist'}</button><button type="button" disabled={disabled} onClick={onToggle} className={cn('inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition', selected ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/10 text-white/65 hover:border-amber-400/40 hover:text-amber-300', disabled && 'cursor-not-allowed opacity-35')}><span className={cn('grid size-4 place-items-center rounded border', selected ? 'border-amber-400/50' : 'border-white/20')}>{selected && <Check className="size-3" />}</span>{selected ? 'Comparing' : 'Compare'}</button></div>
  </article>
}

function ComparisonModal({ universities, onClose, onRemove }: { universities: ComparisonUniversity[]; onClose: () => void; onRemove: (id: string) => void }) {
  const rows: Array<[string, (item: ComparisonUniversity) => string]> = [['Location', (item) => item.city], ['World ranking', (item) => item.rank ? `QS #${item.rank}` : 'Not published'], ['Tuition', (item) => item.tuition], ['Acceptance rate', (item) => item.acceptance], ['Known for / course', (item) => item.knownFor], ['Shortlisted', (item) => item.shortlisted ? 'Yes' : 'No']]
  return <div className="university-compare-overlay fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="comparison-title" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className="university-compare-modal max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1122] shadow-2xl"><header className="university-compare-header flex items-start gap-3 border-b border-white/[.08] p-5 sm:p-6"><span className="grid size-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><GitCompareArrows className="size-5" /></span><div><h3 id="comparison-title" className="font-display text-2xl">Compare universities</h3><p className="mt-1 text-xs text-white/40">Review your options side by side before updating your shortlist.</p></div><button onClick={onClose} aria-label="Close comparison" className="ml-auto grid size-9 place-items-center rounded-xl border border-white/10 text-white/45 hover:text-white"><X className="size-4" /></button></header><div className="overflow-auto p-4 sm:p-6"><div className="university-compare-grid grid min-w-[680px] gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10" style={{ gridTemplateColumns: `160px repeat(${universities.length}, minmax(170px, 1fr))` }}><div className="university-compare-column bg-[#10172b] p-4 text-[10px] font-bold uppercase tracking-[.15em] text-white/35">University</div>{universities.map((item) => <div key={item.id} className="university-compare-column bg-[#10172b] p-4"><div className="flex items-start gap-2"><UniMark initials={initialsOf(item.name)} /><p className="flex-1 text-xs font-semibold leading-5">{item.name}</p><button onClick={() => { onRemove(item.id); if (universities.length === 2) onClose() }} className="text-white/30 hover:text-rose-300"><X className="size-3.5" /></button></div></div>)}{rows.flatMap(([label, value]) => [<div key={`${label}-label`} className="university-compare-cell university-compare-label bg-[#0d1427] p-4 text-[11px] font-semibold text-white/45">{label}</div>, ...universities.map((item) => <div key={`${label}-${item.id}`} className="university-compare-cell bg-[#0d1427] p-4 text-xs leading-5 text-white/75">{value(item)}</div>)])}</div></div></section></div>
}
