'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProgressSidebar from '@/components/onboarding/ProgressSidebar'
import StepCountry from '@/components/onboarding/StepCountry'
import StepEducation from '@/components/onboarding/StepEducation'
import StepUniversity from '@/components/onboarding/StepUniversity'
import StepComplete from '@/components/onboarding/StepComplete'
import type { Country, OnboardingCourseOption, OnboardingData, University } from '@/types'
import { getOnboardingCoursesFn } from '@/features/onboarding/onboarding.functions'
import { MAX_UNIVERSITY_PICKS } from '@/data/onboarding'
import { saveOnboarding } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { ThemeToggle } from '@/components/ThemeToggle'

const initialData: OnboardingData = {
  country: null,
  countries: [],
  educationLevel: '',
  degree: '',
  field: '',
  fields: [],
  feeMinInr: 200000,
  feeMaxInr: 100000000,
  gpa: 3.4,
  gradYear: '',
  englishTest: '',
  intake: '',
  universities: [],
  notSure: false,
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48, filter: 'blur(4px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48, filter: 'blur(4px)' }),
}

export default function Onboarding({ catalog }: { catalog:{ countries:Country[]; universities:University[] } }) {
  const theme = useAppStore((state) => state.theme)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [courses,setCourses]=useState<OnboardingCourseOption[]>([])
  const [coursesLoading,setCoursesLoading]=useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveOnboarding(data)
  }, [data])
  useEffect(()=>{
    if(!data.countries.length){setCourses([]);return}
    let active=true
    setCoursesLoading(true)
    Promise.all(data.countries.map(country=>getOnboardingCoursesFn({data:country.id}).then(items=>items.map(item=>({...item,countryIds:[country.id]}))))).then(groups=>{if(!active)return;const merged=new Map<string,OnboardingCourseOption>();groups.flat().forEach(course=>{const key=`${course.level.toLowerCase()}:${course.name.toLowerCase()}`,current=merged.get(key);merged.set(key,current?{...current,universityIds:[...new Set([...current.universityIds,...course.universityIds])],universities:[...new Map([...(current.universities??[]),...(course.universities??[])].map(university=>[university.id,university])).values()],countryIds:[...new Set([...(current.countryIds??[]),...(course.countryIds??[])])],offerings:[...(current.offerings??[]),...(course.offerings??[])],minFeeInr:Math.min(current.minFeeInr??Infinity,course.minFeeInr??Infinity),feeInrValues:[...new Set([...(current.feeInrValues??[]),...(course.feeInrValues??[])])],universityFeeValuesInr:{...(current.universityFeeValuesInr??{}),...(course.universityFeeValuesInr??{})},intakeMonths:[...new Set([...(current.intakeMonths??[]),...(course.intakeMonths??[])])],universityIntakeMonths:{...(current.universityIntakeMonths??{}),...(course.universityIntakeMonths??{})}}:course)});setCourses([...merged.values()].map(course=>course.minFeeInr===Infinity?{...course,minFeeInr:undefined}:course))}).catch(()=>{if(active)setCourses([])}).finally(()=>{if(active)setCoursesLoading(false)})
    return()=>{active=false}
  },[data.countries.map(country=>country.id).join(',')])

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return data.countries.length > 0
      case 1:
        return Boolean(data.educationLevel && data.degree && data.feeMinInr!==null && data.feeMaxInr!==null && data.feeMaxInr>=data.feeMinInr && data.fields.length && data.gradYear && data.intake)
      case 2:
        return data.notSure || data.universities.length > 0
      default:
        return true
    }
  }, [step, data])

  const eligibleUniversities = useMemo(() => {
    if (step !== 2) return []
    const selectedNames=new Set(data.fields.map(name=>name.toLowerCase()))
    const eligible=new Map<string,University>()
    for(const course of courses){
      if(course.level.toLowerCase()!==data.degree.toLowerCase()||!selectedNames.has(course.name.toLowerCase()))continue
      for(const university of course.universities??[])eligible.set(university.id,university)
    }
    return [...eligible.values()].sort((a,b)=>a.name.localeCompare(b.name))
  },[step,courses,data.fields,data.degree])

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectCountry = (country: Country) => {
    setData((d) => {
      const exists=d.countries.some(item=>item.id===country.id)
      const countries=exists?d.countries.filter(item=>item.id!==country.id):d.countries.length<3?[...d.countries,country]:d.countries
      return {...d,countries,country:countries[0]??null,universities:[],notSure:false,field:'',fields:[],degree:''}
    })
  }

  const toggleUniversity = (u: University) => {
    setData((d) => {
      const exists = d.universities.some((s) => s.id === u.id)
      if (exists) return { ...d, universities: d.universities.filter((s) => s.id !== u.id) }
      if (d.universities.length >= MAX_UNIVERSITY_PICKS) return d
      return { ...d, universities: [...d.universities, u], notSure: false }
    })
  }

  return (
    <div className={cn(theme === 'light' && 'light-theme', 'relative h-screen bg-[#060a18] text-white overflow-hidden')}>
      <ThemeToggle className="fixed right-4 top-4 z-50 lg:right-6 lg:top-6" />
      {/* ambient auroras for the content side */}
      <div className="aurora w-[520px] h-[520px] -top-40 right-[-10%] bg-violet-700/15 lg:hidden" />
      <div className="aurora w-[400px] h-[400px] top-1/3 right-[-15%] bg-indigo-600/12 hidden lg:block" />

      <div className="relative flex h-full">
        <ProgressSidebar step={step} />

        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          <ProgressSidebar step={step} compact />

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin relative z-10">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 py-9 lg:py-14 pb-12">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {step === 0 && <StepCountry countries={catalog.countries} selected={data.countries} onSelect={selectCountry} />}
                  {step === 1 && (
                    <StepEducation
                      educationLevel={data.educationLevel}
                      degree={data.degree}
                      field={data.field}
                      fields={data.fields}
                      countries={data.countries}
                      feeMinInr={data.feeMinInr}
                      feeMaxInr={data.feeMaxInr}
                      courses={courses}
                      coursesLoading={coursesLoading}
                      gpa={data.gpa}
                      gradYear={data.gradYear}
                      englishTest={data.englishTest}
                      intake={data.intake}
                      onChange={(patch) => setData((d) => ({ ...d, ...patch, ...(patch.fields ? { field: patch.fields[0]??'' } : {}), ...((patch.fields !== undefined) || (patch.degree !== undefined && patch.degree !== d.degree) ? { universities: [], notSure: false } : {}) }))}
                    />
                  )}
                  {step === 2 && data.country && (
                    <StepUniversity
                      country={data.country}
                      countries={data.countries}
                      fields={data.fields}
                      degree={data.degree}
                      universities={eligibleUniversities}
                      selected={data.universities}
                      notSure={data.notSure}
                      onToggle={toggleUniversity}
                      onNotSure={() => setData((d) => ({ ...d, notSure: !d.notSure, universities: [] }))}
                    />
                  )}
                  {step === 3 && (
                    <StepComplete
                      data={data}
                      onRestart={() => {
                        setData(initialData)
                        goTo(0)
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* bottom nav bar */}
          {step < 3 && (
            <div className="relative z-20 shrink-0 border-t border-white/[0.07] bg-[#070b1b]/95 backdrop-blur px-5 sm:px-8 lg:px-12 py-4">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                  <button
                    onClick={() => step > 0 && goTo(step - 1)}
                    className={cn(
                      'inline-flex items-center gap-2 text-sm font-medium rounded-2xl px-5 py-3.5 border transition-all',
                      step === 0
                        ? 'opacity-0 pointer-events-none'
                        : 'border-white/12 text-white/60 hover:text-white hover:border-white/30 bg-white/[0.03]'
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          i === step ? 'w-8 bg-amber-400' : i < step ? 'w-1.5 bg-amber-400/50' : 'w-1.5 bg-white/15'
                        )}
                      />
                    ))}
                  </div>

                  <motion.button
                    whileTap={canContinue ? { scale: 0.97 } : undefined}
                    onClick={() => canContinue && goTo(step + 1)}
                    disabled={!canContinue}
                    className={cn(
                      'group inline-flex items-center gap-2.5 text-sm font-semibold rounded-2xl px-6 sm:px-7 py-3.5 transition-all',
                      canContinue
                        ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] shadow-[0_10px_36px_-8px_rgba(242,179,61,0.55)] hover:-translate-y-0.5 hover:shadow-[0_14px_46px_-6px_rgba(242,179,61,0.7)]'
                        : 'bg-white/[0.05] text-white/30 border border-white/10 cursor-not-allowed'
                    )}
                  >
                    {step === 2 ? 'Finish' : 'Continue'}
                    <ArrowRight className={cn('w-4 h-4', canContinue && 'transition-transform group-hover:translate-x-1')} strokeWidth={2.5} />
                  </motion.button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
