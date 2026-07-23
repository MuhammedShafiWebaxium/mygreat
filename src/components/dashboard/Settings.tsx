'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Check, User, Mail, Phone, MapPin, GraduationCap, BookOpen, Plane, Bell, LogOut, Trash2, ShieldCheck } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { COUNTRIES, DEGREES, FIELDS, INTAKES } from '@/data/onboarding'
import type { OnboardingData } from '@/types'
import type { Account } from '@/lib/store'
import { Panel, fadeUp } from './bits'
import { cn } from '@/lib/utils'

interface Props {
  profile: OnboardingData | null
  account: Account | null
  onSaveAccount: (a: Account) => void
  onSaveProfile: (p: OnboardingData) => void
  onSignOut: () => void
}

const NOTIF_PREFS = [
  { id: 'deadlines', label: 'Deadline reminders', desc: 'Nudges 7 and 2 days before every deadline' },
  { id: 'docs', label: 'Document updates', desc: 'When a document is verified or needs changes' },
  { id: 'decisions', label: 'Offers & decisions', desc: 'The moment a university responds' },
  { id: 'counsellor', label: 'Counsellor messages', desc: 'Replies from Priya and the Mygreat team' },
  { id: 'tips', label: 'Tips & product news', desc: 'Occasional guides to strengthen your profile' },
]

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-3.5 h-3.5 text-amber-400/80" />
        <p className="text-[12px] font-semibold text-white/60">{label}</p>
      </div>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[13.5px] placeholder:text-white/30 outline-none focus:border-amber-400/60 focus:bg-white/[0.06] transition-colors'

const selectCls = cn(inputCls, 'appearance-none cursor-pointer [&>option]:bg-[#0a0f24]')

export default function Settings({ profile, account, onSaveAccount, onSaveProfile, onSignOut }: Props) {
  const router = useRouter()
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [phone, setPhone] = useState(account?.phone ?? '')
  const [countryId, setCountryId] = useState(profile?.country?.id ?? '')
  const [degree, setDegree] = useState(profile?.degree ?? '')
  const [field, setField] = useState(profile?.field ?? '')
  const [intake, setIntake] = useState(profile?.intake ?? '')
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    deadlines: true,
    docs: true,
    decisions: true,
    counsellor: true,
    tips: false,
  })
  const [saved, setSaved] = useState(false)

  const save = () => {
    onSaveAccount({ name: name.trim() || 'Future Scholar', email: email.trim(), phone: phone.trim() })
    if (profile) {
      onSaveProfile({
        ...profile,
        country: COUNTRIES.find((c) => c.id === countryId) ?? profile.country,
        degree: degree || profile.degree,
        field: field || profile.field,
        intake: intake || profile.intake,
      })
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h2 className="font-display text-2xl sm:text-3xl font-light">
          <span className="text-gradient-gold font-medium">Settings</span>
        </h2>
        <p className="text-white/45 text-sm mt-1.5">Your account, preferences and notifications in one place.</p>
      </motion.div>

      {/* profile */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
        <Panel className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">Profile</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <Field label="Full name" icon={User}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
            </Field>
            <Field label="Email" icon={Mail}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
            </Field>
            <Field label="Phone (optional)" icon={Phone}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" className={inputCls} />
            </Field>
          </div>
        </Panel>
      </motion.div>

      {/* academic preferences */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <Panel className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">Academic preferences</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <Field label="Destination" icon={MapPin}>
              <select value={countryId} onChange={(e) => setCountryId(e.target.value)} className={selectCls}>
                <option value="">Choose a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Degree" icon={GraduationCap}>
              <select value={degree} onChange={(e) => setDegree(e.target.value)} className={selectCls}>
                <option value="">Choose a degree</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Field of study" icon={BookOpen}>
              <select value={field} onChange={(e) => setField(e.target.value)} className={selectCls}>
                <option value="">Choose a field</option>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Intake" icon={Plane}>
              <select value={intake} onChange={(e) => setIntake(e.target.value)} className={selectCls}>
                <option value="">Choose an intake</option>
                {INTAKES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            onClick={save}
            className={cn(
              'mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[13px] font-semibold transition-all',
              saved
                ? 'bg-emerald-400/15 border border-emerald-400/40 text-emerald-300'
                : 'bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)] hover:-translate-y-0.5'
            )}
          >
            {saved ? <><Check className="w-4 h-4" strokeWidth={3} /> Saved</> : 'Save changes'}
          </button>
        </Panel>
      </motion.div>

      {/* notifications */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400/80" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">Notification preferences</p>
          </div>
          <div className="mt-3 divide-y divide-white/[0.06]">
            {NOTIF_PREFS.map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium">{p.label}</p>
                  <p className="text-[12px] text-white/40 mt-0.5">{p.desc}</p>
                </div>
                <Switch
                  checked={prefs[p.id]}
                  onCheckedChange={(v) => setPrefs((s) => ({ ...s, [p.id]: v }))}
                />
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>

      {/* account actions */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400/80" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">Account</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={onSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold border border-white/12 text-white/70 hover:border-white/30 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <button
              onClick={() => {
                onSignOut()
                router.push('/')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold border border-rose-400/30 text-rose-300 hover:bg-rose-400/10 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete account & data
            </button>
          </div>
          <p className="text-[11px] text-white/30 mt-4 leading-relaxed">
            Signing out clears this device's saved profile. Deleting removes your shortlist, documents and messages permanently.
          </p>
        </Panel>
      </motion.div>
    </div>
  )
}
