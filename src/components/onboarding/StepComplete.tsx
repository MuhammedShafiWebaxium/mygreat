'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/lib/navigation'
import { motion, type Variants } from 'framer-motion'
import {
  Check, MapPin, GraduationCap, Plane, Building2, ArrowRight, RotateCcw,
  User, Mail, Lock, Eye, EyeOff, ShieldCheck, LayoutDashboard, Inbox,
} from 'lucide-react'
import type { OnboardingData } from '@/types'
import { saveAccount } from '@/lib/store'
import { cn } from '@/lib/utils'
import { registerStudentFn } from '@/features/auth/auth.functions'
import { currentUserQuery } from '@/features/auth/auth.queries'

interface Props {
  data: OnboardingData
  onRestart: () => void
}

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, type: 'spring', stiffness: 150, damping: 20 },
  }),
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

export default function StepComplete({ data, onRestart }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const registration = useMutation({
    mutationFn: () => registerStudentFn({
      data: { name: name.trim(), email: email.trim(), password, onboarding: data },
    }),
    onSuccess: (user) => {
      saveAccount({ name: name.trim(), email: email.trim() })
      queryClient.setQueryData(currentUserQuery.queryKey, user)
      setSubmitted(true)
    },
  })

  const nameValid = name.trim().length >= 2
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwValid = password.length >= 8
  const formValid = nameValid && emailValid && pwValid

  const submit = () => {
    setTouched(true)
    if (formValid && !registration.isPending) registration.mutate()
  }

  const summary = [
    {
      icon: MapPin,
      label: 'Destination',
      value: data.country ? `${data.country.flag}  ${data.country.name}` : '—',
    },
    {
      icon: GraduationCap,
      label: 'Program',
      value: [data.degree, data.field].filter(Boolean).join(' in ') || '—',
      sub: [data.gpa ? `GPA ${data.gpa.toFixed(1)}` : '', data.gradYear ? `Class of ${data.gradYear}` : ''].filter(Boolean).join(' · '),
    },
    {
      icon: Plane,
      label: 'Intake',
      value: data.intake || '—',
      sub: data.englishTest && data.englishTest !== 'Not taken yet' ? `${data.englishTest} planned` : 'English test not taken yet',
    },
    {
      icon: Building2,
      label: 'Universities',
      value: data.notSure
        ? 'Open to recommendations'
        : data.universities.length > 0
          ? data.universities.map((u) => u.name).join(', ')
          : '—',
    },
  ]

  const inputCls = (valid: boolean) =>
    cn(
      'w-full bg-white/[0.04] border rounded-2xl pl-11 pr-12 py-3.5 text-sm placeholder:text-white/30 outline-none transition-colors',
      touched && !valid
        ? 'border-rose-400/60 focus:border-rose-400'
        : 'border-white/10 focus:border-amber-400/60 focus:bg-white/[0.06]'
    )

  return (
    <div>
      {/* header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(242,179,61,0.6)]"
        >
          <Check className="w-8 h-8 sm:w-9 sm:h-9 text-[#0a0f24]" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight font-light mt-6">
            Your journey is <span className="text-gradient-gold font-medium">mapped.</span>
          </h2>
          <p className="text-white/50 mt-3 text-[15px] max-w-lg mx-auto">
            Create your Mygreat account to save this profile — you'll apply to your shortlisted universities right from your personal dashboard.
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5 mt-9 max-w-4xl mx-auto items-start">
        {/* summary */}
        <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="glass-panel rounded-3xl p-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 px-4 sm:px-5 pt-4 pb-1">Your profile</p>
          {summary.map((r) => (
            <div key={r.label} className="flex items-start gap-4 p-4 sm:px-5 border-b border-white/[0.06] last:border-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <r.icon className="w-4.5 h-4.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{r.label}</p>
                <p className="text-[14px] font-semibold mt-1 leading-snug">{r.value}</p>
                {r.sub && <p className="text-xs text-white/40 mt-1">{r.sub}</p>}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2.5 m-3 mt-1 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400/90 shrink-0" />
            <p className="text-[11.5px] text-white/45 leading-relaxed">
              Applications, documents and deadlines are managed on your dashboard after sign-up.
            </p>
          </div>
        </motion.div>

        {/* sign-up / success */}
        <motion.div custom={1} variants={rise} initial="hidden" animate="show">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              className="glass-panel rounded-3xl p-7 sm:p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-400" strokeWidth={3} />
              </div>
              <h3 className="font-display text-2xl mt-5">
                Welcome aboard, <span className="text-gradient-gold font-medium">{name.trim().split(' ')[0]}.</span>
              </h3>
              <p className="text-white/50 text-sm leading-relaxed mt-3">
                Your account is ready and your shortlist is saved.
              </p>
              <div className="flex items-center gap-3 text-left rounded-2xl bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 mt-6">
                <Inbox className="w-4.5 h-4.5 text-amber-300 shrink-0" />
                <p className="text-xs text-white/50 leading-relaxed">
                  We sent a verification link to <span className="text-white/85 font-medium">{email}</span>. Verify your email to unlock your dashboard.
                </p>
              </div>
              <button
                onClick={async () => {
                  router.replace('/dashboard')
                }}
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-sm rounded-2xl px-6 py-4 mt-6 shadow-[0_10px_40px_-8px_rgba(242,179,61,0.55)] hover:shadow-[0_14px_50px_-6px_rgba(242,179,61,0.7)] transition-all hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={2.4} />
                Go to my dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </button>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Create your account</p>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      autoComplete="name"
                      className={inputCls(nameValid)}
                    />
                  </div>
                  {touched && !nameValid && <p className="text-rose-400/90 text-xs mt-1.5 ml-1">Please enter your name.</p>}
                </div>

                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      autoComplete="email"
                      className={inputCls(emailValid)}
                    />
                  </div>
                  {touched && !emailValid && <p className="text-rose-400/90 text-xs mt-1.5 ml-1">Enter a valid email address.</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submit()}
                      placeholder="Password (8+ characters)"
                      autoComplete="new-password"
                      className={inputCls(pwValid)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched && !pwValid && <p className="text-rose-400/90 text-xs mt-1.5 ml-1">Password must be at least 8 characters.</p>}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={registration.isPending}
                className="group w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] font-semibold text-sm rounded-2xl px-6 py-4 mt-6 shadow-[0_10px_40px_-8px_rgba(242,179,61,0.55)] hover:shadow-[0_14px_50px_-6px_rgba(242,179,61,0.7)] transition-all hover:-translate-y-0.5"
              >
                {registration.isPending ? 'Creating account…' : 'Create my account'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </motion.button>

              {registration.error && (
                <p role="alert" className="mt-3 text-center text-xs text-rose-400">
                  {registration.error instanceof Error ? registration.error.message : 'Could not create your account.'}
                </p>
              )}

              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[11px] text-white/30 uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-3 bg-white/70 text-slate-500 font-semibold text-sm rounded-2xl px-6 py-3.5 cursor-not-allowed"
              >
                <GoogleMark />
                Google sign-in coming soon
              </button>

              <p className="text-[11px] text-white/30 leading-relaxed mt-5 text-center">
                By continuing you agree to Mygreat's <span className="text-white/55 underline underline-offset-2">Terms</span> and <span className="text-white/55 underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center"
      >
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start over
        </button>
      </motion.div>
    </div>
  )
}
