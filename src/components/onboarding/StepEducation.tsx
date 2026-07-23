import { motion, type Variants } from 'framer-motion'
import { GraduationCap, BookOpen, CalendarDays, Languages, Plane, Award, Check } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { EDUCATION_LEVELS, DEGREES, FIELDS, GRAD_YEARS, ENGLISH_TESTS, INTAKES } from '@/data/onboarding'
import { cn } from '@/lib/utils'

interface Props {
  educationLevel: string
  degree: string
  field: string
  gpa: number
  gradYear: string
  englishTest: string
  intake: string
  onChange: (patch: Partial<{
    educationLevel: string
    degree: string
    field: string
    gpa: number
    gradYear: string
    englishTest: string
    intake: string
  }>) => void
}

function SectionLabel({ icon: Icon, children, optional = false }: { icon: React.ElementType; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <Icon className="w-4 h-4 text-amber-400/80" />
      <p className="text-[13px] font-semibold tracking-wide text-white/80">{children}</p>
      {optional && <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 rounded-full px-2 py-0.5">optional</span>}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-200',
        active
          ? 'bg-amber-400 text-[#0a0f24] border-amber-400 shadow-[0_4px_20px_-4px_rgba(242,179,61,0.5)]'
          : 'bg-white/[0.03] border-white/10 text-white/65 hover:border-white/30 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

const fade: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 150, damping: 20 },
  }),
}

export default function StepEducation(props: Props) {
  const { educationLevel, degree, field, gpa, gradYear, englishTest, intake, onChange } = props

  return (
    <div>
      <p className="text-amber-400/90 text-xs font-semibold tracking-[0.25em] uppercase mb-3">Step 02 — Academics</p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-light">
        Tell us about your <span className="text-gradient-gold font-medium">education.</span>
      </h2>
      <p className="text-white/50 mt-3 text-[15px]">This helps us shortlist programs you're eligible for.</p>

      <div className="mt-9 space-y-9">
        {/* Education level */}
        <motion.section custom={0} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={GraduationCap}>Highest completed education</SectionLabel>
          <div className="grid sm:grid-cols-3 gap-3">
            {EDUCATION_LEVELS.map((l) => {
              const active = educationLevel === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => onChange({ educationLevel: l.id })}
                  className={cn(
                    'relative text-left rounded-2xl p-4 border transition-all duration-200',
                    active
                      ? 'bg-amber-400/[0.08] border-amber-400/70'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/25'
                  )}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#0a0f24]" strokeWidth={3.5} />
                    </span>
                  )}
                  <p className={cn('text-sm font-semibold', active ? 'text-amber-200' : 'text-white')}>{l.label}</p>
                  <p className="text-[11px] text-white/40 mt-1">{l.desc}</p>
                </button>
              )
            })}
          </div>
        </motion.section>

        {/* Degree */}
        <motion.section custom={1} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={BookOpen}>Degree you want to pursue</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {DEGREES.map((d) => (
              <Chip key={d} active={degree === d} onClick={() => onChange({ degree: d })}>{d}</Chip>
            ))}
          </div>
        </motion.section>

        {/* Field */}
        <motion.section custom={2} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={Award}>Field of study</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {FIELDS.map((f) => (
              <Chip key={f} active={field === f} onClick={() => onChange({ field: f })}>{f}</Chip>
            ))}
          </div>
        </motion.section>

        {/* GPA + grad year */}
        <motion.section custom={3} variants={fade} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-8">
          <div>
            <SectionLabel icon={Award}>Academic score <span className="text-white/35 font-normal">(GPA)</span></SectionLabel>
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-end justify-between mb-5">
                <span className="font-display text-4xl text-gradient-gold font-medium">{gpa.toFixed(1)}</span>
                <span className="text-xs text-white/40 mb-1.5">out of 4.0</span>
              </div>
              <Slider
                value={[gpa]}
                min={2}
                max={4}
                step={0.1}
                onValueChange={([v]) => onChange({ gpa: v })}
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-2.5">
                <span>2.0</span><span>3.0</span><span>4.0</span>
              </div>
            </div>
          </div>
          <div>
            <SectionLabel icon={CalendarDays}>Graduation year</SectionLabel>
            <div className="grid grid-cols-3 gap-2.5">
              {GRAD_YEARS.map((y) => (
                <Chip key={y} active={gradYear === y} onClick={() => onChange({ gradYear: y })}>{y}</Chip>
              ))}
            </div>
          </div>
        </motion.section>

        {/* English + intake */}
        <motion.section custom={4} variants={fade} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-8">
          <div>
            <SectionLabel icon={Languages} optional>English proficiency test</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {ENGLISH_TESTS.map((t) => (
                <Chip key={t} active={englishTest === t} onClick={() => onChange({ englishTest: t })}>{t}</Chip>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel icon={Plane}>Preferred intake</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {INTAKES.map((t) => (
                <Chip key={t} active={intake === t} onClick={() => onChange({ intake: t })}>{t}</Chip>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

