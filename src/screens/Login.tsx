'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { loginFn } from '@/features/auth/auth.functions'
import { currentUserQuery } from '@/features/auth/auth.queries'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const FEATURES = [
  'Track every application in one place',
  'Stay ahead of documents and deadlines',
  'Work directly with your admissions team',
]

export default function Login() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const theme = useAppStore((state) => state.theme)
  const isLight = theme === 'light'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const login = useMutation({
    mutationFn: () => loginFn({ data: { email, password } }),
    onSuccess: async (user) => {
      // Seed the authenticated user before entering a protected route. Invalidating
      // here can leave the route guard reading the previously cached anonymous user.
      queryClient.setQueryData(currentUserQuery.queryKey, user)
      router.replace(user.role === 'STUDENT' ? '/dashboard' : '/staff')
    },
  })

  return (
    <main className="login-shell min-h-screen bg-[#07101f]">
      <section className="login-brand-panel relative overflow-hidden border-r border-white/10 px-10 py-10 text-white xl:px-16 xl:py-12">
        <div className="absolute -left-44 -top-40 size-[500px] rounded-full bg-indigo-600/25 blur-[110px]" />
        <div className="absolute -bottom-56 right-[-12rem] size-[520px] rounded-full bg-amber-400/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035] noise" />

        <Link href="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20">
            <Compass className="size-6 text-[#10172a]" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block font-display text-2xl leading-none">Mygreat</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-white/45">Study Abroad</span>
          </span>
        </Link>

        <div className="relative z-10 my-auto max-w-lg py-16">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3.5 py-2 text-xs font-semibold text-amber-200">
            <ShieldCheck className="size-3.5" /> One secure workspace
          </p>
          <h1 className="font-display text-5xl font-light leading-[1.04] tracking-[-0.025em] xl:text-[4rem]">
            Your next chapter,<br />
            <span className="text-gradient-gold font-medium">beautifully organized.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/55">
            From your first shortlist to your final visa decision, keep the whole journey moving with your Mygreat team beside you.
          </p>

          <div className="mt-9 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-white/70">
                <span className="grid size-6 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
                  <CheckCircle2 className="size-3.5 text-emerald-300" />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
          <span>Trusted guidance</span><span className="size-1 rounded-full bg-white/25" />
          <span>Secure student data</span><span className="size-1 rounded-full bg-white/25" />
          <span>Human support</span>
        </div>
      </section>

      <section className={cn('login-form-panel relative flex min-h-screen flex-col', isLight ? 'bg-[#f7f8fb] text-slate-950' : 'bg-[#090e1c] text-white')}>
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:justify-end lg:px-10">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-400"><Compass className="size-5 text-[#10172a]" /></span>
            <span className="font-display text-xl">Mygreat</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            <div className="mb-9">
              <p className={cn('mb-3 text-xs font-bold uppercase tracking-[0.18em]', isLight ? 'text-amber-700' : 'text-amber-300')}>Welcome back</p>
              <h2 className="font-display text-4xl font-medium tracking-tight sm:text-[2.75rem]">Sign in to Mygreat</h2>
              <p className={cn('mt-3 text-[15px]', isLight ? 'text-slate-500' : 'text-white/45')}>
                Continue to your student dashboard or staff workspace.
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 gap-3">
              <div className={cn('rounded-2xl border p-3.5', isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.035]')}>
                <GraduationCap className={cn('mb-2 size-4.5', isLight ? 'text-indigo-600' : 'text-indigo-300')} />
                <p className="text-xs font-semibold">Students</p>
                <p className={cn('mt-0.5 text-[11px]', isLight ? 'text-slate-400' : 'text-white/35')}>Applications & journey</p>
              </div>
              <div className={cn('rounded-2xl border p-3.5', isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.035]')}>
                <BriefcaseBusiness className={cn('mb-2 size-4.5', isLight ? 'text-amber-700' : 'text-amber-300')} />
                <p className="text-xs font-semibold">Mygreat team</p>
                <p className={cn('mt-0.5 text-[11px]', isLight ? 'text-slate-400' : 'text-white/35')}>Admissions & visa desk</p>
              </div>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); login.mutate() }} noValidate>
              <div className="mb-5">
                <label htmlFor="email" className="mb-2 block text-[13px] font-semibold">Email address</label>
                <div className="relative">
                  <Mail className={cn('pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2', isLight ? 'text-slate-400' : 'text-white/30')} />
                  <input
                    id="email"
                    className={cn(
                      'h-13 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10',
                      isLight ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
                    )}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold">Password</label>
                  <span className={cn('text-xs', isLight ? 'text-slate-400' : 'text-white/30')}>Case-sensitive</span>
                </div>
                <div className="relative">
                  <LockKeyhole className={cn('pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2', isLight ? 'text-slate-400' : 'text-white/30')} />
                  <input
                    id="password"
                    className={cn(
                      'h-13 w-full rounded-2xl border pl-11 pr-12 text-sm outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10',
                      isLight ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
                    )}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={cn('absolute right-4 top-1/2 -translate-y-1/2 transition-colors', isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/30 hover:text-white')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {login.error && (
                <div role="alert" className={cn('mt-5 rounded-2xl border px-4 py-3 text-sm', isLight ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-400/20 bg-rose-400/10 text-rose-300')}>
                  {login.error instanceof Error ? login.error.message : 'We could not sign you in. Please check your details.'}
                </div>
              )}

              <button
                disabled={login.isPending || !email || !password}
                className="group mt-6 inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 text-sm font-bold text-[#10172a] shadow-[0_12px_35px_-12px_rgba(245,158,11,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(245,158,11,0.7)] disabled:pointer-events-none disabled:opacity-50"
              >
                {login.isPending ? 'Signing you in…' : 'Sign in securely'}
                {!login.isPending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className={cn('mt-8 border-t pt-6 text-center text-sm', isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/40')}>
              New student?{' '}
              <Link href="/onboarding" className={cn('font-semibold underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current', isLight ? 'text-slate-900' : 'text-white')}>
                Build your study profile
              </Link>
            </div>
          </div>
        </div>

        <footer className={cn('px-5 pb-6 text-center text-[11px]', isLight ? 'text-slate-400' : 'text-white/25')}>
          Protected with encrypted credentials and secure session cookies.
        </footer>
      </section>
    </main>
  )
}
