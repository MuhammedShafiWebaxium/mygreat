'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { Link } from '@/lib/navigation'
import { useRouter } from '@/lib/navigation'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
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
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { AccountType } from '@/features/auth/auth.schema'

const LOGIN_COPY: Record<AccountType, { label: string; title: string; description: string }> = {
  STUDENT: { label: 'Student login', title: 'Sign in as a student', description: 'Continue to your applications and study journey.' },
  PARTNER: { label: 'Partner login', title: 'Sign in as a partner', description: 'Continue to the admissions, visa, or reception workspace.' },
  ADMIN: { label: 'Admin login', title: 'Sign in as an admin', description: 'Continue to the Mygreat administration workspace.' },
}

export default function Login({ accountType }: { accountType: AccountType }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const theme = useAppStore((state) => state.theme)
  const isLight = theme === 'light'
  const [showPassword, setShowPassword] = useState(false)

  const login = useMutation({
    mutationFn: (values: { email: string; password: string }) => loginFn({ data: { ...values, accountType } }),
    onSuccess: async (user) => {
      // Seed the authenticated user before entering a protected route. Invalidating
      // here can leave the route guard reading the previously cached anonymous user.
      queryClient.setQueryData(currentUserQuery.queryKey, user)
      router.replace(user.accountType === 'STUDENT' ? '/dashboard' : '/staff')
    },
  })
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: ({ value }) => login.mutate(value),
  })

  return (
    <main className="login-shell min-h-screen bg-[#07101f]">
      <AuthBrandPanel />

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
              <p className={cn('mb-3 text-xs font-bold uppercase tracking-[0.18em]', isLight ? 'text-amber-700' : 'text-amber-300')}>{LOGIN_COPY[accountType].label}</p>
              <h2 className="font-display text-4xl font-medium tracking-tight sm:text-[2.75rem]">{LOGIN_COPY[accountType].title}</h2>
              <p className={cn('mt-3 text-[15px]', isLight ? 'text-slate-500' : 'text-white/45')}>
                {LOGIN_COPY[accountType].description}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-3 gap-3">
              <Link href="/login/student" aria-current={accountType === 'STUDENT' ? 'page' : undefined} className={cn(
                'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 hover:-translate-y-1',
                accountType === 'STUDENT'
                  ? isLight ? 'border-amber-500/70 bg-amber-50 shadow-[0_8px_40px_-8px_rgba(242,179,61,0.25)]' : 'border-amber-400/70 bg-amber-400/[0.08] shadow-[0_8px_40px_-8px_rgba(242,179,61,0.35)]'
                  : isLight ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]',
              )}>
                <GraduationCap className={cn('mb-2 size-4.5', isLight ? 'text-indigo-600' : 'text-indigo-300')} />
                <p className="text-xs font-semibold">Students</p>
                <p className={cn('mt-0.5 text-[11px]', isLight ? 'text-slate-400' : 'text-white/35')}>Applications & journey</p>
                {accountType === 'STUDENT' && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-amber-400"><Check className="size-3 text-[#0a0f24]" strokeWidth={3.2} /></span>}
              </Link>
              <Link href="/login/partner" aria-current={accountType === 'PARTNER' ? 'page' : undefined} className={cn(
                'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 hover:-translate-y-1',
                accountType === 'PARTNER'
                  ? isLight ? 'border-amber-500/70 bg-amber-50 shadow-[0_8px_40px_-8px_rgba(242,179,61,0.25)]' : 'border-amber-400/70 bg-amber-400/[0.08] shadow-[0_8px_40px_-8px_rgba(242,179,61,0.35)]'
                  : isLight ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]',
              )}>
                <BriefcaseBusiness className={cn('mb-2 size-4.5', isLight ? 'text-amber-700' : 'text-amber-300')} />
                <p className="text-xs font-semibold">Partners</p>
                <p className={cn('mt-0.5 text-[11px]', isLight ? 'text-slate-400' : 'text-white/35')}>Partner workspace</p>
                {accountType === 'PARTNER' && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-amber-400"><Check className="size-3 text-[#0a0f24]" strokeWidth={3.2} /></span>}
              </Link>
              <Link href="/login/admin" aria-current={accountType === 'ADMIN' ? 'page' : undefined} className={cn(
                'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 hover:-translate-y-1',
                accountType === 'ADMIN'
                  ? isLight ? 'border-amber-500/70 bg-amber-50 shadow-[0_8px_40px_-8px_rgba(242,179,61,0.25)]' : 'border-amber-400/70 bg-amber-400/[0.08] shadow-[0_8px_40px_-8px_rgba(242,179,61,0.35)]'
                  : isLight ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]',
              )}>
                <ShieldCheck className={cn('mb-2 size-4.5', isLight ? 'text-emerald-700' : 'text-emerald-300')} />
                <p className="text-xs font-semibold">Admins</p>
                <p className={cn('mt-0.5 text-[11px]', isLight ? 'text-slate-400' : 'text-white/35')}>Administration</p>
                {accountType === 'ADMIN' && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-amber-400"><Check className="size-3 text-[#0a0f24]" strokeWidth={3.2} /></span>}
              </Link>
            </div>

            <form onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }} noValidate>
              <div className="mb-5">
                <label htmlFor="email" className="mb-2 block text-[13px] font-semibold">Email address</label>
                <form.Field name="email" validators={{ onChange: ({ value }) => value ? undefined : 'Email is required.' }}>
                  {(field) => <div className="relative">
                  <Mail className={cn('pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2', isLight ? 'text-slate-400' : 'text-white/30')} />
                  <input
                    id="email"
                    className={cn(
                      'h-13 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10',
                      isLight ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
                    )}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                  </div>}
                </form.Field>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold">Password</label>
                  <span className={cn('text-xs', isLight ? 'text-slate-400' : 'text-white/30')}>Case-sensitive</span>
                </div>
                <form.Field name="password" validators={{ onChange: ({ value }) => value ? undefined : 'Password is required.' }}>
                  {(field) => <div className="relative">
                  <LockKeyhole className={cn('pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2', isLight ? 'text-slate-400' : 'text-white/30')} />
                  <input
                    id="password"
                    className={cn(
                      'h-13 w-full rounded-2xl border pl-11 pr-12 text-sm outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10',
                      isLight ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
                    )}
                    type={showPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
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
                  </div>}
                </form.Field>
              </div>

              {login.error && (
                <div role="alert" className={cn('mt-5 rounded-2xl border px-4 py-3 text-sm', isLight ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-400/20 bg-rose-400/10 text-rose-300')}>
                  {login.error instanceof Error ? login.error.message : 'We could not sign you in. Please check your details.'}
                </div>
              )}

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit]) => <button
                disabled={login.isPending || !canSubmit}
                className="group mt-6 inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 text-sm font-bold text-[#10172a] shadow-[0_12px_35px_-12px_rgba(245,158,11,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(245,158,11,0.7)] disabled:pointer-events-none disabled:opacity-50"
              >
                {login.isPending ? 'Signing you in…' : 'Sign in securely'}
                {!login.isPending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
                </button>}
              </form.Subscribe>
            </form>

            <div className={cn('mt-8 border-t pt-6 text-center text-sm', isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-white/40')}>
              {accountType === 'PARTNER' ? 'New partner company?' : 'New student?'}{' '}
              <Link href={accountType === 'PARTNER' ? '/partner/register' : '/onboarding'} className={cn('font-semibold underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current', isLight ? 'text-slate-900' : 'text-white')}>
                {accountType === 'PARTNER' ? 'Register as a partner' : 'Build your study profile'}
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
