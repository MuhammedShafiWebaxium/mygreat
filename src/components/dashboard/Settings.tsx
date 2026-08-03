'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Check, GraduationCap, Languages, LogOut, Mail, MapPin, Phone, Plane, Save, ShieldCheck, User } from 'lucide-react'
import { EDUCATION_LEVELS, GRAD_YEARS, INTAKES } from '@/data/onboarding'
import { getOnboardingCoursesFn } from '@/features/onboarding/onboarding.functions'
import type { Account } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Country, OnboardingCourseOption, OnboardingData } from '@/types'
import { Panel, fadeUp } from './bits'

interface Props {
  profile: OnboardingData | null
  account: Account | null
  countries: Country[]
  onSaveAccount: (account: Account) => Promise<unknown>
  onSaveProfile: (profile: OnboardingData) => Promise<unknown>
  onSignOut: () => void
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return <div><div className="mb-2.5 flex items-center gap-2"><Icon className="size-3.5 text-amber-400/80"/><p className="text-xs font-semibold text-white/60">{label}</p></div>{children}</div>
}

const inputCls='w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13.5px] outline-none transition-colors placeholder:text-white/30 focus:border-amber-400/60 focus:bg-white/[0.06]'
const selectCls=cn(inputCls,'cursor-pointer appearance-none [&>option]:bg-[#0a0f24]')

export default function Settings({profile,account,countries,onSaveAccount,onSaveProfile,onSignOut}:Props) {
  const [name,setName]=useState(account?.name??'')
  const [email,setEmail]=useState(account?.email??'')
  const [phone,setPhone]=useState(account?.phone??'')
  const [draft,setDraft]=useState<OnboardingData|null>(profile)
  const [courses,setCourses]=useState<OnboardingCourseOption[]>([])
  const [loadingCourses,setLoadingCourses]=useState(false)
  const [saving,setSaving]=useState(false)
  const [message,setMessage]=useState<{type:'success'|'error';text:string}|null>(null)

  useEffect(()=>{setName(account?.name??'');setEmail(account?.email??'');setPhone(account?.phone??'')},[account])
  useEffect(()=>setDraft(profile),[profile])
  useEffect(()=>{
    let active=true
    if(!draft?.country?.id){setCourses([]);setLoadingCourses(false);return}
    setLoadingCourses(true)
    getOnboardingCoursesFn({data:draft.country.id}).then(result=>{if(active)setCourses(result)}).catch(()=>{if(active)setCourses([])}).finally(()=>{if(active)setLoadingCourses(false)})
    return()=>{active=false}
  },[draft?.country?.id])

  const levels=useMemo(()=>Array.from(new Set(courses.map(course=>course.level).filter(Boolean))).sort(),[courses])
  const matchingCourses=useMemo(()=>courses.filter(course=>course.level.toLowerCase()===(draft?.degree??'').toLowerCase()),[courses,draft?.degree])
  const patch=(changes:Partial<OnboardingData>)=>setDraft(current=>current?{...current,...changes}:current)

  const save=async()=>{
    if(!draft){setMessage({type:'error',text:'Complete onboarding before editing academic preferences.'});return}
    try{
      setSaving(true);setMessage(null)
      await Promise.all([
        onSaveAccount({name:name.trim(),email:email.trim(),phone:phone.trim()}),
        onSaveProfile(draft),
      ])
      setMessage({type:'success',text:'Your profile has been updated.'})
    }catch(error){setMessage({type:'error',text:error instanceof Error?error.message:'Unable to save your profile.'})}
    finally{setSaving(false)}
  }

  return <div className="max-w-3xl space-y-5">
    <motion.div variants={fadeUp} initial="hidden" animate="show"><h2 className="font-display text-2xl font-light sm:text-3xl">Profile &amp; <span className="text-gradient-gold font-medium">settings</span></h2><p className="mt-1.5 text-sm text-white/45">These details come from your account and onboarding profile.</p></motion.div>
    <motion.div variants={fadeUp} initial="hidden" animate="show"><Panel className="p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">Personal details</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Full name" icon={User}><input value={name} onChange={event=>setName(event.target.value)} className={inputCls}/></Field><Field label="Email" icon={Mail}><input type="email" value={email} onChange={event=>setEmail(event.target.value)} className={inputCls}/></Field><Field label="Phone (optional)" icon={Phone}><input value={phone} onChange={event=>setPhone(event.target.value)} placeholder="Your phone number" className={inputCls}/></Field></div></Panel></motion.div>
    <motion.div variants={fadeUp} initial="hidden" animate="show"><Panel className="p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">Academic profile</p>{draft?<div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Destination country" icon={MapPin}><select value={draft.country?.id??''} onChange={event=>patch({country:countries.find(country=>country.id===event.target.value)??null,degree:'',field:'',universities:[]})} className={selectCls}><option value="">Choose a country</option>{countries.map(country=><option key={country.id} value={country.id}>{country.flag} {country.name}</option>)}</select></Field>
      <Field label="Highest completed education" icon={GraduationCap}><select value={draft.educationLevel} onChange={event=>patch({educationLevel:event.target.value})} className={selectCls}><option value="">Choose education level</option>{EDUCATION_LEVELS.map(level=><option key={level.id} value={level.id}>{level.label}</option>)}</select></Field>
      <Field label="Degree you want to pursue" icon={BookOpen}><select disabled={!draft.country||loadingCourses} value={draft.degree} onChange={event=>patch({degree:event.target.value,field:'',universities:[]})} className={selectCls}><option value="">{loadingCourses?'Loading levels...':'Choose a degree level'}</option>{levels.map(level=><option key={level} value={level}>{level}</option>)}</select></Field>
      <Field label="Course you want to study" icon={BookOpen}><select disabled={!draft.degree||loadingCourses} value={draft.field} onChange={event=>{const selected=matchingCourses.find(course=>course.name===event.target.value);patch({field:event.target.value,universities:draft.universities.filter(university=>selected?.universityIds.includes(university.id))})}} className={selectCls}><option value="">Choose a course</option>{matchingCourses.map(course=><option key={`${course.level}:${course.name}`} value={course.name}>{course.name}</option>)}</select></Field>
      <Field label="GPA (out of 4)" icon={GraduationCap}><input type="number" min="0" max="4" step="0.1" value={draft.gpa} onChange={event=>patch({gpa:Number(event.target.value)})} className={inputCls}/></Field>
      <Field label="Graduation year" icon={GraduationCap}><select value={draft.gradYear} onChange={event=>patch({gradYear:event.target.value})} className={selectCls}><option value="">Choose a year</option>{GRAD_YEARS.map(year=><option key={year} value={year}>{year}</option>)}</select></Field>
      <Field label="English proficiency tests" icon={Languages}><input value={draft.englishTest} onChange={event=>patch({englishTest:event.target.value})} placeholder="Example: IELTS: 6.5; TOEFL: 90" className={inputCls}/></Field>
      <Field label="Preferred intake" icon={Plane}><select value={draft.intake} onChange={event=>patch({intake:event.target.value})} className={selectCls}><option value="">Choose an intake</option>{INTAKES.map(intake=><option key={intake} value={intake}>{intake}</option>)}</select></Field>
    </div>:<p className="mt-5 text-sm text-white/45">No onboarding profile has been saved yet.</p>}
    {message&&<p className={cn('mt-5 text-xs',message.type==='success'?'text-emerald-300':'text-rose-300')}>{message.text}</p>}
    <button disabled={saving||!draft} onClick={save} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-[13px] font-semibold text-[#0a0f24] shadow-[0_8px_30px_-8px_rgba(242,179,61,.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">{message?.type==='success'?<Check className="size-4"/>:<Save className="size-4"/>}{saving?'Saving...':'Save changes'}</button></Panel></motion.div>
    <motion.div variants={fadeUp} initial="hidden" animate="show"><Panel className="p-5 sm:p-6"><div className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-amber-400/80"/><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/40">Account</p></div><button onClick={onSignOut} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 px-5 py-3 text-[13px] font-semibold text-white/70 transition hover:border-white/30 hover:text-white"><LogOut className="size-4"/>Sign out</button></Panel></motion.div>
  </div>
}
