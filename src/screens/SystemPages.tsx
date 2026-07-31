'use client'

import { Link } from '@/lib/navigation'
import { ArrowLeft, ArrowRight, Compass, Home, Map, RefreshCw, ServerCrash, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface SystemPageProps {
  code: string
  eyebrow: string
  title: React.ReactNode
  description: string
  icon: React.ElementType
  primaryLabel: string
  primaryTo?: '/'
  onPrimary?: () => void
  secondaryLabel?: string
  secondaryTo?: '/' | '/login' | '/onboarding'
}

function SystemPage({ code, eyebrow, title, description, icon: Icon, primaryLabel, primaryTo, onPrimary, secondaryLabel, secondaryTo }: SystemPageProps) {
  const theme = useAppStore((state) => state.theme)
  return (
    <main className={cn(theme === 'light' && 'light-theme', 'relative grid min-h-screen overflow-hidden bg-[#070b18] px-5 py-8 text-white sm:px-8')}>
      <div className="absolute inset-0 opacity-[0.035] noise" />
      <div className="aurora -left-52 -top-48 size-[580px] bg-indigo-600/20" />
      <div className="aurora -bottom-56 -right-40 size-[600px] bg-amber-400/12" />
      <header className="relative z-10 flex h-fit items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Mygreat home"><span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20"><Compass className="size-5 text-[#10172a]" /></span><span><span className="block font-display text-xl font-semibold leading-none">Mygreat</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.24em] text-white/35">Study abroad</span></span></Link>
        <ThemeToggle />
      </header>
      <section className="relative z-10 mx-auto my-auto w-full max-w-3xl py-16 text-center">
        <div className="relative mx-auto w-fit"><p className="select-none font-display text-[9rem] font-semibold leading-none tracking-[-0.08em] text-white/[0.035] sm:text-[13rem]">{code}</p><span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.6rem] border border-amber-300/20 bg-amber-300/[0.09] shadow-[0_0_60px_-18px_rgba(245,158,11,.7)] backdrop-blur-xl"><Icon className="size-8 text-amber-300" /></span></div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">{eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-light leading-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/42 sm:text-base">{description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {primaryTo ? <Link href={primaryTo} className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-4 text-sm font-bold text-[#10172a] shadow-[0_15px_40px_-15px_rgba(245,158,11,.7)] transition hover:-translate-y-0.5"><Home className="size-4" />{primaryLabel}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link> : <button onClick={onPrimary} className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-4 text-sm font-bold text-[#10172a] shadow-[0_15px_40px_-15px_rgba(245,158,11,.7)] transition hover:-translate-y-0.5"><RefreshCw className="size-4" />{primaryLabel}</button>}
          {secondaryLabel && secondaryTo && <Link href={secondaryTo} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-6 py-4 text-sm font-semibold text-white/65 transition hover:border-white/25 hover:text-white"><ArrowLeft className="size-4" />{secondaryLabel}</Link>}
        </div>
      </section>
      <footer className="relative z-10 flex h-fit items-center justify-center gap-2 text-center text-[10px] text-white/25"><ShieldCheck className="size-3.5" /> Your account and saved progress remain secure.</footer>
    </main>
  )
}

export function NotFoundPage() {
  return <SystemPage code="404" eyebrow="Page not found" title={<>This path has gone <span className="text-gradient-gold font-medium">off course.</span></>} description="The page may have moved, the address might be incomplete, or this route never existed. Let’s get you back to familiar ground." icon={Map} primaryLabel="Return home" primaryTo="/" secondaryLabel="Plan my journey" secondaryTo="/onboarding" />
}

export function ServiceUnavailablePage({ reset }: { reset?: () => void }) {
  return <SystemPage code="503" eyebrow="Temporarily unavailable" title={<>We’re making Mygreat <span className="text-gradient-gold font-medium">even better.</span></>} description="The service is taking a short break or experiencing unusually high demand. Your information is safe—please try again in a moment." icon={ServerCrash} primaryLabel="Try again" onPrimary={() => reset ? reset() : window.location.reload()} secondaryLabel="Return home" secondaryTo="/" />
}

export function UnexpectedErrorPage({ reset }: { reset: () => void }) {
  return <SystemPage code="500" eyebrow="Something went wrong" title={<>We hit an unexpected <span className="text-gradient-gold font-medium">detour.</span></>} description="The issue interrupted this page, but your saved work is unaffected. Try loading it again or return home." icon={ServerCrash} primaryLabel="Try again" onPrimary={reset} secondaryLabel="Return home" secondaryTo="/" />
}
