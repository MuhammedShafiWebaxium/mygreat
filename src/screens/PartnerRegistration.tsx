'use client'

import { Link } from '@/lib/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Building2, CheckCircle2, Compass } from 'lucide-react'
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const initialForm = {
  name: '', registrationNumber: '', website: '', address: '', country: '',
  contactName: '', contactEmail: '', contactPhone: '',
}

const placeholders: Record<keyof typeof initialForm, string> = {
  name: 'e.g. Global Study Partners',
  registrationNumber: 'e.g. CIN, ABN, CRN or licence number',
  website: 'https://www.yourcompany.com',
  address: 'Street, city, state and postal code',
  country: 'e.g. India',
  contactName: 'e.g. Priya Sharma',
  contactEmail: 'admin@yourcompany.com',
  contactPhone: 'e.g. +91 98765 43210',
}

export default function PartnerRegistration() {
  const theme = useAppStore((state) => state.theme)
  const isLight = theme === 'light'
  const [form, setForm] = useState(initialForm)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/partners/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Registration failed.')
      setSuccess(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Registration failed.')
    } finally {
      setPending(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <label className="block">
      <span className={cn('mb-2 block text-xs font-semibold', isLight ? 'text-slate-600' : 'text-white/60')}>{label}</span>
      <input
        required={key !== 'website'}
        minLength={key === 'address' || key === 'contactPhone' ? 5 : key === 'website' ? undefined : 2}
        type={type}
        value={form[key]}
        placeholder={placeholders[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
        className={cn(
          'h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-amber-400/60',
          isLight ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25',
        )}
      />
    </label>
  )

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
          <motion.div
            initial={{ opacity: 0, x: 48, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 130, damping: 22 }}
            className="w-full max-w-3xl"
          >
            <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 48, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -48, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 130, damping: 22 }}
                className="py-16 text-center"
              >
                <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
                <h1 className="mt-5 font-display text-3xl">Application submitted</h1>
                <p className={cn('mx-auto mt-3 max-w-md text-sm leading-6', isLight ? 'text-slate-500' : 'text-white/50')}>Our Super Admin will review your company. If approved, the Partner Admin credentials will be emailed to your contact address.</p>
                <Link href="/login/partner" className="mt-7 inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900">Partner login</Link>
              </motion.div>
            ) : (
              <motion.div
                key="registration"
                initial={{ opacity: 0, x: 48, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -48, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 130, damping: 22 }}
              >
                <Link
                  href="/login/partner"
                  className={cn(
                    'mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors',
                    isLight ? 'text-slate-500 hover:text-slate-950' : 'text-white/45 hover:text-white',
                  )}
                >
                  <ArrowLeft className="size-4" />
                  Back to Partner login
                </Link>
                <p className={cn('text-xs font-bold uppercase tracking-[0.18em]', isLight ? 'text-amber-700' : 'text-amber-300')}>Partner registration</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={cn('grid size-11 place-items-center rounded-2xl border', isLight ? 'border-amber-200 bg-amber-50' : 'border-amber-300/20 bg-amber-300/[0.09]')}><Building2 className={cn('size-5', isLight ? 'text-amber-700' : 'text-amber-300')} /></span>
                  <div><h1 className="font-display text-3xl">Register your study abroad company</h1><p className={cn('mt-1 text-sm', isLight ? 'text-slate-500' : 'text-white/45')}>Submit your partner company for verification and access.</p></div>
                </div>
                <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
                  {field('name', 'Company name')}
                  {field('registrationNumber', 'Company registration number')}
                  {field('website', 'Website (optional)', 'url')}
                  {field('country', 'Country')}
                  <div className="sm:col-span-2">{field('address', 'Registered address')}</div>
                  {field('contactName', 'Partner administrator full name')}
                  {field('contactEmail', 'Partner administrator email', 'email')}
                  {field('contactPhone', 'Partner administrator phone', 'tel')}
                  {error && <p className="text-sm text-rose-500 sm:col-span-2">{error}</p>}
                  <div className="flex items-center justify-between gap-4 pt-3 sm:col-span-2">
                    <Link href="/login/partner" className={cn('text-sm', isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/45 hover:text-white')}>Already registered? Sign in</Link>
                    <button disabled={pending} className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 disabled:opacity-50">{pending ? 'Submitting…' : 'Submit for review'}</button>
                  </div>
                </form>
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
