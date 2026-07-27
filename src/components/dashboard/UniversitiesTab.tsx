import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Compass, MapPin, Sparkles, Trophy } from 'lucide-react'
import type { Reco, StudentProfile } from '@/data/dashboard'
import type { University } from '@/types'
import { Panel, PanelTitle, UniMark, fadeUp } from './bits'

interface Props {
  student: StudentProfile
  shortlisted: University[]
  recommendations: Reco[]
}

const initialsOf = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase()

export default function UniversitiesTab({ student, shortlisted, recommendations }: Props) {
  return (
    <div className="space-y-5 max-w-5xl">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h2 className="font-display text-2xl sm:text-3xl font-light">
          Your <span className="text-gradient-gold font-medium">universities</span>
        </h2>
        <p className="text-white/45 text-sm mt-1.5">
          Shortlisted during onboarding{student.country ? ` · ${student.country} ${student.flag}` : ''}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
        <Panel>
          <PanelTitle>Shortlist · {shortlisted.length}</PanelTitle>
          {shortlisted.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-3 px-4 sm:px-5 pb-5">
              {shortlisted.map((university) => (
                <div key={university.id} className="rounded-2xl p-4.5 border border-white/[0.07] bg-white/[0.02] hover:border-white/20 transition-all flex flex-col">
                  <div className="flex items-center gap-3">
                    <UniMark initials={initialsOf(university.name)} />
                    <div className="min-w-0">
                      <p className="font-semibold text-[14px] truncate">{university.name}</p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {university.city} · QS #{university.rank}
                      </p>
                    </div>
                  </div>
                  <p className="text-[12px] text-white/45 mt-3 leading-snug flex-1">{university.knownFor}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3 text-[10.5px]">
                    <span className="text-white/40">{university.tuition}/yr</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-300"><CheckCircle2 className="size-3" />Shortlisted</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-4 sm:mx-5 mb-5 rounded-2xl p-6 border border-dashed border-white/15 text-center">
              <p className="text-[13.5px] font-semibold">No universities shortlisted yet</p>
              <p className="text-[11.5px] text-white/35 mt-1">Pick from the recommended matches below.</p>
            </div>
          )}
        </Panel>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <Panel>
          <PanelTitle right={<span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40"><Sparkles className="w-3.5 h-3.5 text-amber-400/80" /> Based on GPA {student.gpa.toFixed(1)} · {student.target}</span>}>
            Recommended matches
          </PanelTitle>
          <div className="grid md:grid-cols-3 gap-3 px-4 sm:px-5 pb-5">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-2xl p-4.5 border border-white/[0.07] bg-white/[0.02] hover:border-amber-400/30 hover:bg-amber-400/[0.03] transition-all flex flex-col">
                <div className="flex items-center gap-3">
                  <UniMark initials={recommendation.initials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><p className="font-semibold text-[14px] truncate">{recommendation.name}</p>{recommendation.rank <= 5 && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}</div>
                    <p className="text-[11px] text-white/40 mt-0.5">{recommendation.city} · QS #{recommendation.rank}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-white/45 mt-4 pt-3 border-t border-white/[0.06]"><span>Tuition <span className="text-white/80 font-medium">{recommendation.tuition}</span></span><span>Accept. <span className="text-white/80 font-medium">{recommendation.acceptance}</span></span></div>
                <div className="flex items-center justify-between mt-3.5"><span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-2 py-0.5">{recommendation.match}% match</span><button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-300/90 hover:text-amber-200 transition-colors">Shortlist <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} /></button></div>
              </div>
            ))}
            <button className="rounded-2xl p-4.5 border border-dashed border-white/15 hover:border-amber-400/40 hover:bg-amber-400/[0.02] transition-all flex flex-col items-center justify-center text-center min-h-[170px] group">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:border-amber-400/40 transition-colors"><Compass className="w-5 h-5 text-white/50 group-hover:text-amber-300 transition-colors" /></div>
              <p className="font-semibold text-[14px] mt-3.5">Explore more universities</p><p className="text-[11.5px] text-white/35 mt-1">Filter by course, budget & city</p>
            </button>
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}
