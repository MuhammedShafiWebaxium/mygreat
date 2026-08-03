import { useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { GraduationCap, BookOpen, CalendarDays, Languages, Plane, Award, Check, Search, ChevronDown, Lightbulb, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { EDUCATION_LEVELS, DEGREES, GRAD_YEARS, ENGLISH_TESTS, INTAKES } from '@/data/onboarding'
import type { OnboardingCourseOption } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  educationLevel: string
  degree: string
  field: string
  courses: OnboardingCourseOption[]
  coursesLoading: boolean
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

function Chip({ active, onClick, children, disabled = false, title }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-selected={active}
      className={cn(
        'onboarding-chip px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-200 disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.02] disabled:text-white/25 disabled:shadow-none',
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

const TEST_CONFIG = {
  IELTS: { min: 0, max: 9, step: 0.5, initial: 6.5 },
  TOEFL: { min: 0, max: 120, step: 1, initial: 80 },
  PTE: { min: 10, max: 90, step: 1, initial: 58 },
  Duolingo: { min: 10, max: 160, step: 5, initial: 105 },
} as const

function readEnglishTests(value:string) {
  if(!value||value==='Not taken yet') return {} as Record<string,number>
  return Object.fromEntries(value.split(';').map(item=>item.trim()).filter(Boolean).map(item=>{const [name,score]=item.split(':').map(part=>part.trim()),numeric=Number(score);return [name,Number.isFinite(numeric)&&score!==''?numeric:TEST_CONFIG[name as keyof typeof TEST_CONFIG]?.initial||0]}))
}

function writeEnglishTests(tests:Record<string,number>) {
  return Object.entries(tests).map(([name,score])=>`${name}: ${score}`).join('; ')
}

export default function StepEducation(props: Props) {
  const { educationLevel, degree, field, courses, coursesLoading, gpa, gradYear, englishTest, intake, onChange } = props
  const [courseQuery,setCourseQuery]=useState('')
  const [courseOpen,setCourseOpen]=useState(false)
  const [activeTest,setActiveTest]=useState('')
  const availableDegrees=useMemo(()=>DEGREES.filter(degreeName=>courses.some(course=>course.level.toLowerCase()===degreeName.toLowerCase())),[courses])
  const orderedDegrees=useMemo(()=>[...DEGREES].sort((left,right)=>Number(!availableDegrees.includes(left))-Number(!availableDegrees.includes(right))),[availableDegrees])
  const filteredCourses=useMemo(()=>courses.filter(course=>course.level.toLowerCase()===degree.toLowerCase()&&course.name.toLowerCase().includes(courseQuery.toLowerCase())),[courses,courseQuery,degree])
  const selectedTests=readEnglishTests(englishTest)
  const orderedTests=useMemo(()=>Object.entries(selectedTests).sort(([left],[right])=>Number(left===activeTest)-Number(right===activeTest)),[englishTest,activeTest])
  useEffect(()=>{if(activeTest&&!selectedTests[activeTest])setActiveTest(Object.keys(selectedTests)[0]??'')},[englishTest,activeTest])
  const toggleTest=(test:string)=>{
    if(test==='Not taken yet'){setActiveTest('');onChange({englishTest:englishTest==='Not taken yet'?'':'Not taken yet'});return}
    const next={...selectedTests}
    if(test in next) delete next[test]
    else {next[test]=TEST_CONFIG[test as keyof typeof TEST_CONFIG].initial;setActiveTest(test)}
    onChange({englishTest:writeEnglishTests(next)})
  }
  const setTestScore=(test:string,score:number)=>onChange({englishTest:writeEnglishTests({...selectedTests,[test]:score})})

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
          <SectionLabel icon={BookOpen}><span>Degree you want to pursue</span><span className="group relative inline-flex align-middle"><button type="button" aria-label="Why are some degree options disabled?" className="ml-1 inline-flex rounded-full text-amber-400 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"><Lightbulb className="size-3.5"/></button><span role="tooltip" className="onboarding-level-tooltip pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b1122] px-3 py-2 text-left text-[10px] font-normal leading-4 text-white/65 shadow-xl group-hover:block group-focus-within:block">Disabled levels have no active courses in your selected country.</span></span></SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {orderedDegrees.map((d) => (
              <Chip key={d} active={degree === d} disabled={coursesLoading || !availableDegrees.includes(d)} title={!coursesLoading && !availableDegrees.includes(d) ? `No ${d} courses are currently available in the selected country.` : undefined} onClick={() => onChange({ degree: d, field: '' })}>{d}</Chip>
            ))}
          </div>
        </motion.section>

        {/* Course */}
        <motion.section custom={2} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={Award}>Course you want to study</SectionLabel>
          <div className="relative">
            <button type="button" disabled={!degree} onClick={()=>setCourseOpen(value=>!value)} className="flex w-full items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left text-sm transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-55">
              <span className={cn('min-w-0 flex-1 truncate',field?'text-white':'text-white/30')}>{field||(degree?'Search and select a course':'Select a course level first')}</span><ChevronDown className={cn('size-4 text-white/35 transition',courseOpen&&'rotate-180')} />
            </button>
            {courseOpen&&<div className="onboarding-course-menu absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122] shadow-2xl"><div className="onboarding-course-search relative border-b border-white/[.07] p-3"><Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-white/30"/><input autoFocus value={courseQuery} onChange={event=>setCourseQuery(event.target.value)} placeholder="Search courses…" className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400/40"/></div><div className="onboarding-course-options scrollbar-thin max-h-72 overflow-y-auto p-2">{coursesLoading?<p className="p-5 text-center text-xs text-white/40">Loading courses…</p>:filteredCourses.length?filteredCourses.map(course=><button type="button" key={course.name} data-selected={field===course.name} onClick={()=>{onChange({field:course.name});setCourseQuery('');setCourseOpen(false)}} className={cn('onboarding-course-option flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs transition',field===course.name?'bg-amber-400/10 text-amber-200':'text-white/65')}><span className="flex-1">{course.name}</span><span className="ml-3 text-[10px] text-white/30">{course.universityIds.length} universities</span>{field===course.name&&<Check className="ml-2 size-3.5 text-amber-300"/>}</button>):<p className="p-5 text-center text-xs text-white/40">No courses match “{courseQuery}”.</p>}</div></div>}
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
                <Chip key={t} active={t==='Not taken yet'?englishTest===t:t in selectedTests} onClick={() => toggleTest(t)}>{t}</Chip>
              ))}
            </div>
            {orderedTests.length>0&&<div className="mt-5 px-1 pb-1 pt-7">{orderedTests.map(([test,score],index)=>{const config=TEST_CONFIG[test as keyof typeof TEST_CONFIG],active=test===activeTest||(!activeTest&&index===orderedTests.length-1);if(!config)return null;return <motion.div layout key={test} style={{zIndex:index+1}} className={cn('english-test-card relative rounded-2xl border border-white/10 bg-[#10172b] px-4 shadow-xl transition-colors',index>0&&'-mt-7',active?'pb-5 pt-4 ring-1 ring-amber-400/40':'h-16 cursor-pointer pt-3')} onClick={()=>!active&&setActiveTest(test)}><div className="flex items-center gap-3"><button type="button" onClick={()=>setActiveTest(test)} className="min-w-0 flex-1 text-left"><span className="block text-[10px] uppercase tracking-[.16em] text-white/35">English test</span><span className="mt-0.5 block text-xs font-semibold text-white/75">{test}</span></button><span className="font-display text-2xl font-medium text-gradient-gold">{score}</span><button type="button" aria-label={`Remove ${test}`} onClick={event=>{event.stopPropagation();toggleTest(test)}} className="grid size-7 place-items-center rounded-lg text-white/30 transition hover:bg-white/[.07] hover:text-rose-300"><X className="size-3.5"/></button></div>{active&&<motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="mt-5"><Slider value={[score]} min={config.min} max={config.max} step={config.step} onValueChange={([value])=>setTestScore(test,value)}/><div className="mt-2 flex justify-between text-[10px] text-white/30"><span>{config.min}</span><span>{config.max}</span></div></motion.div>}</motion.div>})}</div>}
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
