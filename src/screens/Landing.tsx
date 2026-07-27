'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Compass,
  FileCheck2,
  Globe2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Menu,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LandingPreloader } from '@/components/LandingPreloader'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const destinations = [
  { code: 'US', country: 'United States', city: 'Boston · New York · California', universities: '320+', accent: 'from-indigo-500/25 to-sky-400/5' },
  { code: 'GB', country: 'United Kingdom', city: 'London · Manchester · Edinburgh', universities: '160+', accent: 'from-rose-500/20 to-orange-400/5' },
  { code: 'CA', country: 'Canada', city: 'Toronto · Vancouver · Montréal', universities: '98+', accent: 'from-red-500/20 to-amber-400/5' },
  { code: 'AU', country: 'Australia', city: 'Sydney · Melbourne · Brisbane', universities: '43+', accent: 'from-emerald-500/20 to-cyan-400/5' },
]

const journey = [
  { number: '01', icon: Compass, title: 'Tell us where you’re headed', copy: 'Share your destination, academics, preferred program, and intake. It takes less than five minutes.' },
  { number: '02', icon: Search, title: 'Build a smarter shortlist', copy: 'Compare universities that fit your goals, profile, and budget—not a generic popularity list.' },
  { number: '03', icon: Plane, title: 'Move from offer to arrival', copy: 'Keep applications, documents, deadlines, and visa milestones organized in one calm workspace.' },
]

const features = [
  { icon: GraduationCap, title: 'Profile-led matching', copy: 'Recommendations shaped around your academics, goals, intake, and destination.' },
  { icon: FileCheck2, title: 'One application workspace', copy: 'Know what is submitted, what needs attention, and exactly what comes next.' },
  { icon: HeartHandshake, title: 'Human guidance', copy: 'Work with admissions and visa specialists who can see your full journey.' },
  { icon: ShieldCheck, title: 'Secure by design', copy: 'Your profile, documents, and account data stay protected and under your control.' },
]

export default function Landing() {
  const theme = useAppStore((state) => state.theme)
  const isLight = theme === 'light'
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPreloading, setIsPreloading] = useState(true)
  const finishPreloading = useCallback(() => setIsPreloading(false), [])

  return (
    <>
      <AnimatePresence>{isPreloading && <LandingPreloader onComplete={finishPreloading} />}</AnimatePresence>
      <div
        aria-hidden={isPreloading}
        className={cn(
          isLight && 'light-theme',
          isPreloading && 'pointer-events-none h-[100svh] overflow-hidden',
          'landing-page min-h-screen overflow-hidden bg-[#070b18] text-white',
        )}
      >
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] noise" />

      <header className={cn('fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl', isLight ? 'border-slate-200/80 bg-white/80' : 'border-white/[0.07] bg-[#070b18]/80')}>
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Mygreat home">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20">
              <Compass className="size-5 text-[#10172a]" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold leading-none">Mygreat</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.25em] text-white/40">Study abroad</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <a href="#destinations" className="text-sm text-white/55 transition hover:text-white">Destinations</a>
            <a href="#how-it-works" className="text-sm text-white/55 transition hover:text-white">How it works</a>
            <a href="#why-mygreat" className="text-sm text-white/55 transition hover:text-white">Why Mygreat</a>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-8">
            <ThemeToggle />
            <Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:text-white sm:inline-flex">Sign in</Link>
            <Link href="/onboarding" className="hidden items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#10172a] shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-amber-300 sm:inline-flex">
              Find my universities <ArrowRight className="size-4" />
            </Link>
            <button onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-xl border border-white/10 lg:hidden" aria-label="Toggle menu" aria-expanded={menuOpen}>
              <Menu className="size-5" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-5 py-5 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a href="#destinations" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/65">Destinations</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/65">How it works</a>
              <a href="#why-mygreat" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm text-white/65">Why Mygreat</a>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link href="/login" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold">Sign in</Link>
                <Link href="/onboarding" className="rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-bold text-[#10172a]">Get started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="landing-hero relative px-5 pb-20 pt-36 sm:px-8 sm:pt-44 lg:px-10 lg:pb-28">
          <div className="aurora -left-40 top-12 size-[520px] bg-indigo-600/20" />
          <div className="aurora -right-52 top-0 size-[620px] bg-amber-400/10" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.04fr_.96fr]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <div className="landing-hero-badge mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3.5 py-2 text-xs font-semibold text-amber-200">
                <Sparkles className="size-3.5" /> Your study abroad journey starts here
              </div>
              <h1 className="max-w-3xl font-display text-[3.2rem] font-light leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[5rem]">
                Turn your ambition into an <span className="text-gradient-gold font-medium">admission plan.</span>
              </h1>
              <p className="mt-7 max-w-xl text-[17px] leading-8 text-white/50 sm:text-lg">
                Find universities that fit your story, build a confident shortlist, and manage every application milestone in one beautifully simple place.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/onboarding" className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-4 text-sm font-bold text-[#10172a] shadow-[0_18px_50px_-15px_rgba(245,158,11,.7)] transition hover:-translate-y-1">
                  Build my study plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white">
                  See how it works <ChevronRight className="size-4" />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/40">
                <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Free profile</span>
                <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> No commitment</span>
                <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Takes 5 minutes</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12 }} className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="landing-hero-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1225]/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Your journey</p>
                    <p className="mt-1 font-display text-xl">Fall 2027 intake</p>
                  </div>
                  <span className="landing-profile-badge rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">Profile ready</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[['12', 'Matches'], ['4', 'Shortlisted'], ['2', 'Applications']].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                      <p className="landing-metric-value font-display text-2xl text-amber-200">{value}</p>
                      <p className="mt-1 text-[10px] text-white/35 sm:text-xs">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">Top university matches</p>
                    <span className="text-xs text-amber-300">View all</span>
                  </div>
                  {[
                    ['TU Delft', 'Netherlands', '92%'],
                    ['University of Manchester', 'United Kingdom', '88%'],
                    ['University of Toronto', 'Canada', '84%'],
                  ].map(([name, country, score], index) => (
                    <div key={name} className="flex items-center gap-3 border-t border-white/[0.06] py-3 first:border-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-amber-300/10 text-xs font-bold text-white/70">{index + 1}</span>
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="mt-0.5 text-[11px] text-white/35">{country}</p></div>
                      <span className="ml-auto rounded-lg bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-300">{score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="landing-review-card absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11182d] px-4 py-3 shadow-xl sm:-left-9">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-[#10172a]"><BadgeCheck className="size-5" /></span>
                <div><p className="text-xs font-semibold">Application reviewed</p><p className="mt-0.5 text-[10px] text-white/35">Your advisor left feedback</p></div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-white/[0.018] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <p className="max-w-sm text-sm leading-6 text-white/40">Built for ambitious students planning their next chapter across the world.</p>
            <div className="grid grid-cols-3 gap-8 sm:gap-14">
              <div><p className="font-display text-2xl text-white">600+</p><p className="text-[10px] uppercase tracking-wider text-white/30">Universities</p></div>
              <div><p className="font-display text-2xl text-white">10+</p><p className="text-[10px] uppercase tracking-wider text-white/30">Destinations</p></div>
              <div><p className="font-display text-2xl text-white">1</p><p className="text-[10px] uppercase tracking-wider text-white/30">Clear workspace</p></div>
            </div>
          </div>
        </section>

        <section id="destinations" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Explore possibilities</p><h2 className="mt-4 max-w-2xl font-display text-4xl font-light leading-tight sm:text-5xl">A world of campuses. <span className="text-gradient-gold font-medium">One place to begin.</span></h2></div>
              <Link href="/onboarding" className="group flex w-fit items-center gap-2 text-sm font-semibold text-white/60 hover:text-white">Explore all destinations <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {destinations.map((destination) => (
                <Link key={destination.code} href="/onboarding" className="group relative min-h-64 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-amber-300/25">
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-70 transition group-hover:opacity-100', destination.accent)} />
                  <div className="relative flex h-full flex-col"><span className="font-display text-5xl font-light text-white/25">{destination.code}</span><div className="mt-auto"><div className="mb-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><MapPin className="size-4 text-amber-300" /></div><h3 className="font-display text-2xl">{destination.country}</h3><p className="mt-2 text-xs leading-5 text-white/40">{destination.city}</p><div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs"><span className="text-white/35">{destination.universities} universities</span><ArrowRight className="size-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-amber-300" /></div></div></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-steps-section scroll-mt-20 border-y border-white/[0.07] bg-[#090f20] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">From unsure to underway</p><h2 className="mt-4 font-display text-4xl font-light sm:text-5xl">A clearer path in <span className="text-gradient-gold font-medium">three steps.</span></h2><p className="mt-5 text-sm leading-7 text-white/45 sm:text-base">Less searching in circles. More confident decisions, visible progress, and support when it matters.</p></div>
            <div className="relative mt-16 grid gap-5 lg:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-12 hidden border-t border-dashed border-white/10 lg:block" />
              {journey.map((item) => (
                <div key={item.number} className="relative rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 sm:p-8">
                  <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-amber-400 text-[#10172a] shadow-lg shadow-amber-500/15"><item.icon className="size-5" /></span><span className="font-display text-4xl text-white/10">{item.number}</span></div>
                  <h3 className="mt-8 font-display text-2xl">{item.title}</h3><p className="mt-3 text-sm leading-7 text-white/40">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-mygreat" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Built around your journey</p><h2 className="mt-4 font-display text-4xl font-light leading-tight sm:text-5xl">Everything important, <span className="text-gradient-gold font-medium">nothing overwhelming.</span></h2><p className="mt-6 max-w-lg text-sm leading-7 text-white/45 sm:text-base">Mygreat brings discovery, decisions, paperwork, and expert support together—so you always know where you stand.</p><Link href="/onboarding" className="group mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold transition hover:border-amber-300/25">Start your free profile <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:bg-white/[0.04] sm:p-7"><span className="grid size-11 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/10"><feature.icon className="size-5 text-amber-300" /></span><h3 className="mt-6 font-display text-xl">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-white/40">{feature.copy}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32">
          <div className="landing-final-cta relative mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] border border-amber-300/15 bg-gradient-to-br from-[#171b2d] to-[#0b1122] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="aurora -left-32 top-0 size-80 bg-indigo-500/20" /><div className="aurora -right-24 top-0 size-80 bg-amber-400/15" />
            <div className="relative mx-auto max-w-3xl"><Globe2 className="mx-auto size-9 text-amber-300" /><h2 className="mt-6 font-display text-4xl font-light leading-tight sm:text-5xl">Your next chapter deserves a <span className="text-gradient-gold font-medium">great beginning.</span></h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">Create your profile, discover your best-fit universities, and turn a big dream into clear next steps.</p><Link href="/onboarding" className="group mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-7 py-4 text-sm font-bold text-[#10172a] shadow-[0_18px_50px_-15px_rgba(245,158,11,.7)] transition hover:-translate-y-1">Plan my study journey <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-amber-400"><Compass className="size-4.5 text-[#10172a]" /></span><span className="font-display text-xl">Mygreat</span></Link>
          <p className="text-xs text-white/30 md:ml-5">Study abroad, made clear.</p>
          <div className="flex flex-wrap gap-6 text-xs text-white/35 md:ml-auto"><a href="#destinations" className="hover:text-white">Destinations</a><a href="#how-it-works" className="hover:text-white">How it works</a><Link href="/login" className="hover:text-white">Sign in</Link></div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} Mygreat</p>
        </div>
      </footer>
      </div>
    </>
  )
}
