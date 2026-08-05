import { useEffect, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { createPortal } from 'react-dom'
import { GraduationCap, BookOpen, CalendarDays, Languages, Plane, Award, Check, Search, ChevronDown, Lightbulb, X, WalletCards } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { EDUCATION_LEVELS, DEGREES, GRAD_YEARS, ENGLISH_TESTS, INTAKE_MONTHS } from '@/data/onboarding'
import type { Country, OnboardingCourseOffering, OnboardingCourseOption } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  educationLevel: string
  degree: string
  field: string
  fields: string[]
  countries: Country[]
  feeMinInr: number | null
  feeMaxInr: number | null
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
    fields: string[]
    feeMinInr: number | null
    feeMaxInr: number | null
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

function TuitionRange({minimum,maximum,onChange}:{minimum:number;maximum:number;onChange:(minimum:number,maximum:number)=>void}){
  const left=((minimum-2)/49)*100,right=((maximum-2)/49)*100
  const rangeClass='pointer-events-none absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-400 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-400 [&::-moz-range-thumb]:bg-white'
  return <div><div className="relative h-8"><div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10"/><div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-400" style={{left:`${left}%`,right:`${100-right}%`}}/><input aria-label="Minimum annual tuition" type="range" min={2} max={50} step={1} value={minimum} onChange={event=>onChange(Math.min(Number(event.target.value),maximum-1),maximum)} className={rangeClass}/><input aria-label="Maximum annual tuition" type="range" min={3} max={51} step={1} value={maximum} onChange={event=>onChange(minimum,Math.max(Number(event.target.value),minimum+1))} className={rangeClass}/></div><div className="mt-2 flex justify-between text-[10px] text-white/35"><span>₹2 lakh</span><span>₹50 lakh+</span></div></div>
}

function IntakeDropdown({label,value,placeholder,options,open,disabled=false,onOpen,onSelect}:{label:string;value:string;placeholder:string;options:string[];open:boolean;disabled?:boolean;onOpen:()=>void;onSelect:(value:string)=>void}){
  return <div className="relative"><span className="mb-2 block text-[10px] font-semibold text-white/40">{label}</span><button type="button" disabled={disabled} onClick={onOpen} className="intake-dropdown-trigger flex w-full items-center rounded-xl border border-white/10 bg-white/[.035] px-3 py-3 text-left text-sm text-white outline-none transition hover:border-amber-400/30 disabled:cursor-not-allowed disabled:opacity-45"><span className={cn('min-w-0 flex-1',!value&&'text-white/35')}>{value||placeholder}</span><ChevronDown className={cn('size-4 text-white/35 transition',open&&'rotate-180')}/></button>{open&&!disabled&&<div className="intake-dropdown-menu scrollbar-thin absolute inset-x-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 p-2 shadow-2xl">{options.map(option=><button type="button" key={option} onClick={()=>onSelect(option)} className={cn('intake-dropdown-option flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs transition',value===option&&'is-selected')}>{option}{value===option&&<Check className="ml-auto size-3.5"/>}</button>)}</div>}</div>
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

const show=(value:string|number|undefined)=>value===0?'0':value||'Not provided'
const fee=(offering:OnboardingCourseOffering)=>{const original=offering.feeAmount&&offering.feeCurrency?`${offering.feeCurrency} ${Number(offering.feeAmount).toLocaleString()}`:show(offering.tuitionFee);return offering.amountInr?`${original} · ≈₹${Number(offering.amountInr).toLocaleString('en-IN',{maximumFractionDigits:0})}`:original}

export function CourseComparisonModal({fields,degree,courses,countries,universityIds,onClose}:{fields:string[];degree:string;courses:OnboardingCourseOption[];countries:Country[];universityIds?:string[];onClose:()=>void}) {
  useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>event.key==='Escape'&&onClose();window.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)}},[onClose])
  return createPortal(<div className={cn('course-compare-overlay fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm',document.querySelector('.light-theme')&&'light-theme')}><section role="dialog" aria-modal="true" aria-labelledby="course-comparison-title" className="course-compare-modal flex h-screen w-screen flex-col overflow-hidden border-white/10 bg-[#0b1122] shadow-2xl"><header className="course-compare-header flex shrink-0 items-start border-b border-white/[.08] px-5 py-4 sm:px-8 sm:py-5"><div><h3 id="course-comparison-title" className="font-display text-2xl sm:text-3xl">Complete course comparison</h3><p className="mt-1 text-xs text-white/40">Every available course detail for your selected universities.</p></div><button type="button" aria-label="Close comparison" onClick={onClose} className="course-compare-close ml-auto grid size-10 place-items-center rounded-xl border border-white/10 text-white/50 hover:text-white"><X className="size-5"/></button></header><div className="course-compare-body flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><div className="mx-auto grid w-full max-w-[1800px] gap-5 lg:grid-cols-2 xl:grid-cols-3">{fields.map(name=>{const course=courses.find(item=>item.name===name&&item.level.toLowerCase()===degree.toLowerCase()),offerings=(course?.offerings??[]).filter(offering=>!universityIds?.length||universityIds.includes(offering.universityId));return <article key={name} className="course-compare-course overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]"><div className="course-compare-course-header border-b border-white/[.08] bg-amber-400/[.06] p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-300">{show(course?.level)}</p><h4 className="mt-1 text-base font-semibold leading-6">{name}</h4><p className="mt-2 text-[11px] text-white/40">{offerings.length} selected universit{offerings.length===1?'y':'ies'} · {countries.filter(country=>offerings.some(offering=>offering.countryId===country.id)).map(country=>`${country.flag} ${country.name}`).join(', ')}</p></div><div className="divide-y divide-white/[.08]">{offerings.map(offering=><section key={offering.courseId} className="course-compare-offering p-5"><div className="flex items-start justify-between gap-3"><div><h5 className="text-sm font-semibold text-white/85">{offering.universityName}</h5><p className="mt-1 text-[11px] text-white/40">{countries.find(country=>country.id===offering.countryId)?.flag} {offering.city} · {show(offering.campus)}</p></div><strong className="shrink-0 text-sm text-amber-300">{fee(offering)}</strong></div><dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-[11px]">{[['Course code',offering.code],['Duration',offering.durationMonths?`${offering.durationMonths} months`:''],['Intake',[...offering.intakeMonth,offering.intakeYear].filter(Boolean).join(' ')],['Ranking',offering.ranking],['IELTS minimum',offering.ieltsMin],['TOEFL minimum',offering.toeflMin],['PTE minimum',offering.pteMin],['Deadline',offering.applicationDeadline],['Scholarship',offering.scholarshipAvailable],['Backlogs',offering.backlogRange],['Application mode',offering.applicationMode],['English proficiency',offering.englishProficiency]].map(([label,value])=><div key={label}><dt className="text-white/30">{label}</dt><dd className="mt-1 leading-5 text-white/70">{show(value as string)}</dd></div>)}</dl>{[['Requirements',offering.requirements],['Entry requirements',offering.entryRequirements],['Remarks',offering.remarks]].map(([label,value])=><div key={label} className="mt-4 rounded-xl bg-white/[.035] p-3 text-[11px]"><p className="font-semibold text-white/35">{label}</p><p className="mt-1 leading-5 text-white/65">{show(value)}</p></div>)}</section>)}{!offerings.length&&<p className="p-6 text-center text-xs text-white/40">This course is not offered by the selected universities.</p>}</div></article>})}</div></div></section></div>,document.body)
}

export default function StepEducation(props: Props) {
  const { educationLevel, degree, fields, countries, feeMinInr, feeMaxInr, courses, coursesLoading, gpa, gradYear, englishTest, intake, onChange } = props
  const [courseQuery,setCourseQuery]=useState('')
  const [debouncedCourseQuery,setDebouncedCourseQuery]=useState('')
  const [visibleCourseCount,setVisibleCourseCount]=useState(50)
  const [courseOpen,setCourseOpen]=useState(false)
  const [activeTest,setActiveTest]=useState('')
  const [intakeDropdown,setIntakeDropdown]=useState<'year'|'month'|null>(null)
  const intakeParts=intake.includes(':')?intake.split(':'):['',intake]
  const storedIntakeYear=intakeParts[0]??''
  const selectedIntakeMonths=(intakeParts[1]??'').split('|').filter(Boolean)
  const [intakeYear,setIntakeYear]=useState(storedIntakeYear)
  const today=new Date(),currentIntakeYear=today.getFullYear(),currentIntakeMonthIndex=today.getMonth()
  const intakeYears=Array.from({length:5},(_,index)=>String(currentIntakeYear+index))
  const availableIntakeMonths=intakeYear===String(currentIntakeYear)?INTAKE_MONTHS.slice(currentIntakeMonthIndex):INTAKE_MONTHS
  const availableDegrees=useMemo(()=>DEGREES.filter(degreeName=>courses.some(course=>course.level.toLowerCase()===degreeName.toLowerCase())),[courses])
  const orderedDegrees=useMemo(()=>[...DEGREES].sort((left,right)=>Number(!availableDegrees.includes(left))-Number(!availableDegrees.includes(right))),[availableDegrees])
  const matchingCourses=useMemo(()=>courses.filter(course=>{const feeMatches=(course.feeInrValues??[]).some(fee=>fee>=(feeMinInr??200000)&&fee<=(feeMaxInr??8000000)),intakeMatches=intake==='Flexible'||selectedIntakeMonths.some(month=>course.intakeMonths?.includes(month));return feeMatches&&intakeMatches&&course.level.toLowerCase()===degree.toLowerCase()&&course.name.toLowerCase().includes(debouncedCourseQuery.toLowerCase())}),[courses,debouncedCourseQuery,degree,feeMinInr,feeMaxInr,intake])
  const filteredCourses=useMemo(()=>matchingCourses.slice(0,visibleCourseCount),[matchingCourses,visibleCourseCount])
  const selectedTests=readEnglishTests(englishTest)
  const orderedTests=useMemo(()=>Object.entries(selectedTests).sort(([left],[right])=>Number(left===activeTest)-Number(right===activeTest)),[englishTest,activeTest])
  useEffect(()=>{if(activeTest&&!selectedTests[activeTest])setActiveTest(Object.keys(selectedTests)[0]??'')},[englishTest,activeTest])
  useEffect(()=>{if(storedIntakeYear)setIntakeYear(storedIntakeYear)},[storedIntakeYear])
  useEffect(()=>{const timer=window.setTimeout(()=>setDebouncedCourseQuery(courseQuery),250);return()=>window.clearTimeout(timer)},[courseQuery])
  useEffect(()=>setVisibleCourseCount(50),[debouncedCourseQuery,degree])
  const loadMoreCourses=(element:HTMLDivElement)=>{if(element.scrollHeight-element.scrollTop-element.clientHeight<48)setVisibleCourseCount(count=>Math.min(count+50,matchingCourses.length))}
  const toggleTest=(test:string)=>{
    if(test==='Not taken yet'){setActiveTest('');onChange({englishTest:englishTest==='Not taken yet'?'':'Not taken yet'});return}
    const next={...selectedTests}
    if(test in next) delete next[test]
    else {next[test]=TEST_CONFIG[test as keyof typeof TEST_CONFIG].initial;setActiveTest(test)}
    onChange({englishTest:writeEnglishTests(next)})
  }
  const setTestScore=(test:string,score:number)=>onChange({englishTest:writeEnglishTests({...selectedTests,[test]:score})})
  const toggleCourse=(name:string)=>onChange({fields:fields.includes(name)?fields.filter(item=>item!==name):fields.length<3?[...fields,name]:fields})

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
          <SectionLabel icon={BookOpen}><span>Degree you want to pursue</span><span className="group relative inline-flex align-middle"><button type="button" aria-label="Why are some degree options disabled?" className="ml-1 inline-flex rounded-full text-amber-400 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"><Lightbulb className="size-3.5"/></button><span role="tooltip" className="onboarding-level-tooltip pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b1122] px-3 py-2 text-left text-[10px] font-normal leading-4 text-white/65 shadow-xl group-hover:block group-focus-within:block">Disabled levels have no active courses in your selected countries.</span></span></SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {orderedDegrees.map((d) => (
              <Chip key={d} active={degree === d} disabled={coursesLoading || !availableDegrees.includes(d)} title={!coursesLoading && !availableDegrees.includes(d) ? `No ${d} courses are currently available in the selected countries.` : undefined} onClick={() => onChange({ degree: d, field: '', fields: [] })}>{d}</Chip>
            ))}
          </div>
        </motion.section>

        <motion.section custom={2} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={WalletCards}>Preferred annual tuition fee</SectionLabel>
          <p className="mb-3 text-[11px] text-white/40">Approximate INR values based on the latest admin-refreshed central-bank rates.</p>
          <div className="glass-panel rounded-2xl p-5">
            <div className="mb-5 flex items-end justify-between gap-4"><span className="font-display text-3xl font-medium text-gradient-gold">₹{((feeMinInr??200000)/100000).toFixed(0)}–{feeMaxInr===100000000?'50 lakh+':`${((feeMaxInr??5000000)/100000).toFixed(0)} lakh`}</span><span className="mb-1 text-xs text-white/40">per year</span></div>
            <TuitionRange minimum={(feeMinInr??200000)/100000} maximum={feeMaxInr===100000000?51:Math.min(51,(feeMaxInr??5000000)/100000)} onChange={(minimum,maximum)=>onChange({feeMinInr:minimum*100000,feeMaxInr:maximum===51?100000000:maximum*100000,fields:[]})}/>
          </div>
        </motion.section>

        <motion.section custom={3} variants={fade} initial="hidden" animate="show" className={cn('relative',intakeDropdown?'z-[80]':'z-10')}>
          <SectionLabel icon={Plane}>Preferred intake months</SectionLabel>
          <p className="mb-3 text-[11px] text-white/40">Choose an intake year and month. Available courses will be filtered by the selected month.</p>
          <div className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-2"><IntakeDropdown label="Intake year" value={intakeYear} placeholder="Select year" options={intakeYears} open={intakeDropdown==='year'} onOpen={()=>setIntakeDropdown(value=>value==='year'?null:'year')} onSelect={year=>{const validMonths=year===String(currentIntakeYear)?INTAKE_MONTHS.slice(currentIntakeMonthIndex):INTAKE_MONTHS,month=selectedIntakeMonths[0];setIntakeYear(year);setIntakeDropdown(null);onChange({intake:month&&validMonths.includes(month)?`${year}:${month}`:'',fields:[]})}}/><IntakeDropdown label="Intake month" value={availableIntakeMonths.includes(selectedIntakeMonths[0]??'')?(selectedIntakeMonths[0]??''):''} placeholder="Select month" options={availableIntakeMonths} disabled={!intakeYear} open={intakeDropdown==='month'} onOpen={()=>setIntakeDropdown(value=>value==='month'?null:'month')} onSelect={month=>{setIntakeDropdown(null);onChange({intake:`${intakeYear}:${month}`,fields:[]})}}/></div>
        </motion.section>

        {/* Course */}
        <motion.section custom={4} variants={fade} initial="hidden" animate="show">
          <SectionLabel icon={Award}>Course you want to study</SectionLabel>
          <div className="relative">
            <button type="button" disabled={!degree||feeMaxInr===null||!intake} onClick={()=>setCourseOpen(value=>!value)} className="flex w-full items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left text-sm transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-55">
              <span className={cn('min-w-0 flex-1 truncate',fields.length?'text-white':'text-white/30')}>{fields.length?`${fields.length} course${fields.length===1?'':'s'} selected`:(!degree?'Select a course level first':feeMaxInr===null?'Choose a fee range first':!intake?'Choose preferred intake year and month first':'Search and select up to 3 courses')}</span><ChevronDown className={cn('size-4 text-white/35 transition',courseOpen&&'rotate-180')} />
            </button>
            {courseOpen&&<div className="onboarding-course-menu absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1122] shadow-2xl"><div className="onboarding-course-search relative border-b border-white/[.07] p-3"><Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-white/30"/><input autoFocus value={courseQuery} onChange={event=>setCourseQuery(event.target.value)} placeholder="Search courses…" className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-3 text-sm outline-none focus:border-amber-400/40"/></div><div onScroll={event=>loadMoreCourses(event.currentTarget)} className="onboarding-course-options scrollbar-thin max-h-72 overflow-y-auto p-2">{coursesLoading?<p className="p-5 text-center text-xs text-white/40">Loading courses…</p>:courseQuery!==debouncedCourseQuery?<p className="p-5 text-center text-xs text-white/40">Searching…</p>:filteredCourses.length?<>{filteredCourses.map(course=>{const active=fields.includes(course.name),availableCountries=countries.filter(country=>course.countryIds?.includes(country.id));return <button type="button" disabled={!active&&fields.length>=3} key={course.name} data-selected={active} onClick={()=>toggleCourse(course.name)} className={cn('onboarding-course-option flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-40',active?'bg-amber-400/10 text-amber-200':'text-white/65')}><span className="min-w-0 flex-1"><span className="block truncate">{course.name}</span><span className="mt-1 block truncate text-[10px] text-white/35">{availableCountries.map(country=>`${country.flag} ${country.name}`).join(' · ')||'Selected destinations'}</span></span><span className="ml-3 shrink-0 text-[10px] text-white/30">{course.universityIds.length} universities</span>{active&&<Check className="ml-2 size-3.5 shrink-0 text-amber-300"/>}</button>})}{filteredCourses.length<matchingCourses.length&&<p className="py-3 text-center text-[10px] text-white/35">Scroll to load more courses…</p>}</>:<p className="p-5 text-center text-xs text-white/40">No courses match “{courseQuery}”.</p>}</div><div className="flex justify-between border-t border-white/[.07] px-4 py-3 text-[11px] text-white/40"><span>{fields.length}/3 selected</span><span>Showing {filteredCourses.length} of {matchingCourses.length}</span></div></div>}
          </div>
          {fields.length>0&&<div className="mt-4 flex flex-wrap items-center gap-2">{fields.map(name=><button type="button" key={name} onClick={()=>toggleCourse(name)} className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[.08] px-3 py-2 text-xs text-amber-100">{name}<X className="size-3"/></button>)}</div>}
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

        {/* English */}
        <motion.section custom={6} variants={fade} initial="hidden" animate="show">
          <div>
            <SectionLabel icon={Languages} optional>English proficiency test</SectionLabel>
            <div className="flex flex-wrap gap-2.5">
              {ENGLISH_TESTS.map((t) => (
                <Chip key={t} active={t==='Not taken yet'?englishTest===t:t in selectedTests} onClick={() => toggleTest(t)}>{t}</Chip>
              ))}
            </div>
            {orderedTests.length>0&&<div className="mt-5 px-1 pb-1 pt-7">{orderedTests.map(([test,score],index)=>{const config=TEST_CONFIG[test as keyof typeof TEST_CONFIG],active=test===activeTest||(!activeTest&&index===orderedTests.length-1);if(!config)return null;return <motion.div layout key={test} style={{zIndex:index+1}} className={cn('english-test-card relative rounded-2xl border border-white/10 bg-[#10172b] px-4 shadow-xl transition-colors',index>0&&'-mt-7',active?'pb-5 pt-4 ring-1 ring-amber-400/40':'h-16 cursor-pointer pt-3')} onClick={()=>!active&&setActiveTest(test)}><div className="flex items-center gap-3"><button type="button" onClick={()=>setActiveTest(test)} className="min-w-0 flex-1 text-left"><span className="block text-[10px] uppercase tracking-[.16em] text-white/35">English test</span><span className="mt-0.5 block text-xs font-semibold text-white/75">{test}</span></button><span className="font-display text-2xl font-medium text-gradient-gold">{score}</span><button type="button" aria-label={`Remove ${test}`} onClick={event=>{event.stopPropagation();toggleTest(test)}} className="grid size-7 place-items-center rounded-lg text-white/30 transition hover:bg-white/[.07] hover:text-rose-300"><X className="size-3.5"/></button></div>{active&&<motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="mt-5"><Slider value={[score]} min={config.min} max={config.max} step={config.step} onValueChange={([value])=>setTestScore(test,value)}/><div className="mt-2 flex justify-between text-[10px] text-white/30"><span>{config.min}</span><span>{config.max}</span></div></motion.div>}</motion.div>})}</div>}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
