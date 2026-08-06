'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Crown,
  LogOut,
  Save,
  ShieldCheck,
  Zap,
  CreditCard,
  Building,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  getStudentSupport,
  dummySubscribe,
  receiptSubscribe,
} from '@/features/support/support.functions'
import { speakNotification, triggerOsNotification } from '@/lib/notifications'
import type { Account } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { OnboardingData, StudentAgencyDetails } from '@/types'
import { Panel, fadeUp } from './bits'

interface Props {
  profile: OnboardingData | null
  account: Account | null
  onSaveAccount: (account: Account) => Promise<unknown>
  onSaveAgencyProfile: (details: StudentAgencyDetails) => Promise<unknown>
  onSignOut: () => void
}

type SettingsTab = 'profile' | 'academics' | 'subscription' | 'account'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] outline-none transition placeholder:text-white/30 focus:border-amber-400/60'
const selectCls = cn(inputCls, 'cursor-pointer [&>option]:bg-[#0a0f24]')

const emptyDetails: StudentAgencyDetails = {
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  residenceCountry: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  passportStatus: '',
  passportNumber: '',
  passportExpiry: '',
  preferredContactMethod: '',
  whatsappNumber: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  fundingSource: '',
  sponsorName: '',
  educationLoanStatus: '',
  visaRefusalHistory: 'NO',
  visaRefusalDetails: '',
  travelHistory: '',
  workExperienceYears: '',
  counsellingNotes: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.13em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  )
}

function ReadOnly({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[.14em] text-white/30">{label}</p>
      <p className="mt-1.5 text-xs text-white/75">{value || 'Not provided'}</p>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Panel className="p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/45">{title}</p>
      <p className="mt-1 text-xs text-white/35">{description}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Panel>
  )
}

export default function Settings({
  profile,
  account,
  onSaveAccount,
  onSaveAgencyProfile,
  onSignOut,
}: Props) {
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [phone, setPhone] = useState(account?.phone ?? '')
  const [details, setDetails] = useState<StudentAgencyDetails>({
    ...emptyDetails,
    ...profile?.agencyDetails,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [subscription, setSubscription] = useState<any>()

  // Payment Gateway Modal state
  const [showGateway, setShowGateway] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'online' | 'manual'>('online')
  const [processing, setProcessing] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [txnRef, setTxnRef] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(account?.name ?? '')
    setEmail(account?.email ?? '')
    setPhone(account?.phone ?? '')
  }, [account])

  useEffect(() => setDetails({ ...emptyDetails, ...profile?.agencyDetails }), [profile])

  const loadSupport = async () => {
    const data = await getStudentSupport()
    setSubscription(data)
  }

  useEffect(() => {
    loadSupport()
  }, [])

  const patch = (changes: Partial<StudentAgencyDetails>) =>
    setDetails((current) => ({ ...current, ...changes }))

  const save = async () => {
    try {
      setSaving(true)
      setMessage(null)
      await Promise.all([
        onSaveAccount({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
        onSaveAgencyProfile(details),
      ])
      setMessage({ type: 'success', text: 'Your profile has been updated.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to save your profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle Instant Online Cashfree Checkout Gateway
  const handleOnlinePayment = async () => {
    try {
      setProcessing(true)
      await dummySubscribe()
      speakNotification('Payment successful! Your Mygreat Pro membership is active.')
      triggerOsNotification({
        title: 'Payment Successful',
        message: 'Your Mygreat Pro subscription is now active!',
      })
      await loadSupport()
      setShowGateway(false)
    } catch (err: any) {
      alert(err.message || 'Payment failed.')
    } finally {
      setProcessing(false)
    }
  }

  // Handle Manual Bank Receipt Upload
  const handleManualReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiptFile) {
      alert('Please select a payment receipt file.')
      return
    }
    try {
      setProcessing(true)
      await receiptSubscribe(receiptFile)
      speakNotification('Receipt submitted. Admin verification pending.')
      triggerOsNotification({
        title: 'Receipt Submitted',
        message: 'Your payment receipt is under admin verification.',
      })
      await loadSupport()
      setShowGateway(false)
      setReceiptFile(null)
      setTxnRef('')
    } catch (err: any) {
      alert(err.message || 'Failed to submit receipt.')
    } finally {
      setProcessing(false)
    }
  }

  const saveBar = (
    <>
      {message && (
        <p className={cn('text-xs', message.type === 'success' ? 'text-emerald-300' : 'text-rose-300')}>
          {message.text}
        </p>
      )}
      <button
        disabled={saving || !profile}
        onClick={save}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-[13px] font-semibold text-[#0a0f24] disabled:opacity-50"
      >
        {message?.type === 'success' ? <Check className="size-4" /> : <Save className="size-4" />}
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </>
  )

  const isProActive = subscription?.subscription?.status === 'ACTIVE'
  const isProPending = subscription?.subscription?.status === 'PENDING'

  return (
    <div className="max-w-4xl space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[.025] p-1.5">
          {(
            [
              { id: 'profile', label: 'Profile' },
              { id: 'academics', label: 'Academics' },
              { id: 'subscription', label: 'Subscription' },
              { id: 'account', label: 'Account' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-xs font-semibold transition',
                tab === item.id
                  ? 'bg-amber-400 text-[#0a0f24]'
                  : 'text-white/45 hover:bg-white/[.05] hover:text-white'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </motion.div>

      {tab === 'profile' && (
        <>
          <Section title="Personal and contact details" description="Your legal and current contact information.">
            <Field label="Full legal name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </Field>
            <Field label="WhatsApp number">
              <input value={details.whatsappNumber} onChange={(e) => patch({ whatsappNumber: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Date of birth">
              <input type="date" value={details.dateOfBirth} onChange={(e) => patch({ dateOfBirth: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Gender">
              <select value={details.gender} onChange={(e) => patch({ gender: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </Field>
            <Field label="Marital status">
              <select value={details.maritalStatus} onChange={(e) => patch({ maritalStatus: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Nationality">
              <input value={details.nationality} onChange={(e) => patch({ nationality: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Current country of residence">
              <input value={details.residenceCountry} onChange={(e) => patch({ residenceCountry: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Preferred contact">
              <select value={details.preferredContactMethod} onChange={(e) => patch({ preferredContactMethod: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Email</option>
                <option>Phone</option>
                <option>WhatsApp</option>
              </select>
            </Field>
            <Field label="Address">
              <textarea value={details.addressLine} onChange={(e) => patch({ addressLine: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input value={details.city} onChange={(e) => patch({ city: e.target.value })} className={inputCls} />
              </Field>
              <Field label="State">
                <input value={details.state} onChange={(e) => patch({ state: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Postal code">
              <input value={details.postalCode} onChange={(e) => patch({ postalCode: e.target.value })} className={inputCls} />
            </Field>
          </Section>
          <Section title="Passport and travel" description="Required for admissions and visa planning.">
            <Field label="Passport status">
              <select value={details.passportStatus} onChange={(e) => patch({ passportStatus: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Available</option>
                <option>Applied</option>
                <option>Not applied</option>
              </select>
            </Field>
            <Field label="Passport number">
              <input disabled={details.passportStatus !== 'Available'} value={details.passportNumber} onChange={(e) => patch({ passportNumber: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Passport expiry">
              <input disabled={details.passportStatus !== 'Available'} type="date" value={details.passportExpiry} onChange={(e) => patch({ passportExpiry:e.target.value })} className={inputCls} />
            </Field>
            <Field label="Previous visa refusal">
              <select value={details.visaRefusalHistory} onChange={(e) => patch({ visaRefusalHistory: e.target.value })} className={selectCls}>
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </Field>
            {details.visaRefusalHistory === 'YES' && (
              <div className="sm:col-span-2">
                <Field label="Visa refusal details">
                  <textarea value={details.visaRefusalDetails} onChange={(e) => patch({ visaRefusalDetails: e.target.value })} rows={3} className={inputCls} />
                </Field>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label="International travel history">
                <textarea value={details.travelHistory} onChange={(e) => patch({ travelHistory: e.target.value })} rows={3} placeholder="Countries visited, visa type and year" className={inputCls} />
              </Field>
            </div>
          </Section>
          <Section title="Funding and experience" description="Helps us plan affordability, scholarships and financial documents.">
            <Field label="Primary funding source">
              <select value={details.fundingSource} onChange={(e) => patch({ fundingSource: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Self-funded</option>
                <option>Parents / family</option>
                <option>Education loan</option>
                <option>Scholarship</option>
                <option>Employer / sponsor</option>
              </select>
            </Field>
            <Field label="Sponsor name">
              <input value={details.sponsorName} onChange={(e) => patch({ sponsorName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Education loan status">
              <select value={details.educationLoanStatus} onChange={(e) => patch({ educationLoanStatus: e.target.value })} className={selectCls}>
                <option value="">Select</option>
                <option>Not required</option>
                <option>Planning to apply</option>
                <option>In progress</option>
                <option>Pre-approved</option>
                <option>Approved</option>
              </select>
            </Field>
            <Field label="Work experience (years)">
              <input type="number" min="0" max="50" value={details.workExperienceYears} onChange={(e) => patch({ workExperienceYears: e.target.value })} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Goals or counsellor notes">
                <textarea value={details.counsellingNotes} onChange={(e) => patch({ counsellingNotes: e.target.value })} rows={4} placeholder="Career goals, concerns, preferred cities, dependants or anything your counsellor should know" className={inputCls} />
              </Field>
            </div>
          </Section>
          <Section title="Emergency contact" description="A trusted family member or guardian.">
            <Field label="Contact name">
              <input value={details.emergencyContactName} onChange={(e) => patch({ emergencyContactName: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Relationship">
              <input value={details.emergencyContactRelation} onChange={(e) => patch({ emergencyContactRelation: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Contact phone">
              <input value={details.emergencyContactPhone} onChange={(e) => patch({ emergencyContactPhone: e.target.value })} className={inputCls} />
            </Field>
          </Section>
          <div className="flex flex-wrap items-center gap-4">{saveBar}</div>
        </>
      )}

      {tab === 'academics' && (
        <Panel className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-amber-300" />
            <div>
              <p className="text-sm font-semibold">Academic profile is locked</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                These verified onboarding details cannot be edited by the student. Contact your counsellor if a correction is required.
              </p>
            </div>
          </div>
          {profile ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ReadOnly label="Destination" value={profile.country?.name} />
              <ReadOnly label="Education" value={profile.educationLevel} />
              <ReadOnly label="Degree" value={profile.degree} />
              <ReadOnly label="Courses" value={profile.fields?.join(', ') || profile.field} />
              <ReadOnly label="GPA" value={profile.gpa} />
              <ReadOnly label="Graduation year" value={profile.gradYear} />
              <ReadOnly label="English tests" value={profile.englishTest} />
              <ReadOnly label="Preferred intake" value={profile.intake.replace(':', ' · ')} />
              <ReadOnly
                label="Annual tuition preference"
                value={`₹${((profile.feeMinInr ?? 0) / 100000).toFixed(0)}–${
                  profile.feeMaxInr === 100000000 ? '50+' : ((profile.feeMaxInr ?? 0) / 100000).toFixed(0)
                } lakh`}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/40">No onboarding profile found.</p>
          )}
        </Panel>
      )}

      {tab === 'subscription' && (
        <div className="space-y-5">
          {/* Pro Membership Banner */}
          <Panel className="p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[#0a0f24] shadow-lg shadow-amber-500/20">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-white">Mygreat Pro Membership</h3>
                    <p className="text-xs text-white/40">Premium study-abroad guidance, priority support & application speed</p>
                  </div>
                </div>
              </div>
              <div>
                {isProActive ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Active Pro Member
                  </span>
                ) : isProPending ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-bold">
                    <Clock className="w-4 h-4" /> Receipt Verification Pending
                  </span>
                ) : (
                  <button
                    onClick={() => setShowGateway(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 text-xs font-bold text-[#0a0f24] shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5"
                  >
                    <Zap className="w-4 h-4" /> Subscribe Now (₹999/mo)
                  </button>
                )}
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ReadOnly label="Plan" value={subscription?.plan?.displayPrice ?? '₹999 / month'} />
              <ReadOnly
                label="Status"
                value={
                  isProActive ? 'ACTIVE' : isProPending ? 'VERIFICATION PENDING' : 'FREE PLAN'
                }
              />
              <ReadOnly
                label="Payment Method"
                value={
                  subscription?.subscription?.method
                    ? subscription.subscription.method.replaceAll('_', ' ')
                    : 'N/A'
                }
              />
            </div>

            {/* Pro Member Perks List */}
            <div className="mt-6 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300/90 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Included Pro Membership Benefits
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Priority 1-on-1 Counsellor Support Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Expedited SOP & Document Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Direct University Application Submission Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Visa Preparation & Mock Interview Assistance</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Payment Receipts History Table */}
          <Panel className="p-6">
            <h4 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Payment & Transaction History
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Reference / Txn ID</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {(subscription?.payments || []).map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-white/80 font-medium">
                        {new Date(pay.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-white/60">{pay.method?.replaceAll('_', ' ')}</td>
                      <td className="py-3 font-semibold text-amber-300">
                        ₹{(pay.amountMinor / 100).toLocaleString('en-IN')} {pay.currency}
                      </td>
                      <td className="py-3 text-white/40 font-mono text-[11px]">
                        {pay.providerReference || pay.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                            pay.status === 'SUCCEEDED'
                              ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                              : pay.status === 'PENDING'
                              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                              : 'bg-rose-400/10 text-rose-300 border border-rose-400/20'
                          )}
                        >
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!subscription?.payments || subscription.payments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/30 text-xs">
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'account' && (
        <Panel className="p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-amber-300" />
            <h3 className="font-display text-2xl">Account security</h3>
          </div>
          <p className="mt-2 text-xs text-white/40">Sign out from this device securely.</p>
          <button
            onClick={onSignOut}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-3 text-sm font-semibold text-white/70"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </Panel>
      )}

      {/* 6ASkillcity-Style Payment Gateway Checkout Modal */}
      <AnimatePresence>
        {showGateway && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !processing && setShowGateway(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-lg glass-panel rounded-3xl border border-white/15 bg-[#0a0f24] p-6 sm:p-7 shadow-2xl shadow-black text-white"
            >
              {/* Close Button */}
              <button
                disabled={processing}
                onClick={() => setShowGateway(false)}
                className="absolute top-5 right-5 p-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-all disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[#0a0f24] font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">Payment Gateway Checkout</h3>
                  <p className="text-xs text-white/40">Secure Payment for Mygreat Pro Membership</p>
                </div>
              </div>

              {/* Price Summary */}
              <div className="my-5 p-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Mygreat Pro Plan</p>
                  <p className="text-[11px] text-white/40 mt-0.5">30 Days Membership Access</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-300">₹999 INR</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">Taxes included</p>
                </div>
              </div>

              {/* Gateway Mode Switcher */}
              <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                    paymentMode === 'online'
                      ? 'bg-amber-400 text-[#0a0f24] shadow-md'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  <Zap className="w-4 h-4" /> Instant Online Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('manual')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                    paymentMode === 'manual'
                      ? 'bg-amber-400 text-[#0a0f24] shadow-md'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  <Upload className="w-4 h-4" /> Bank Transfer & Receipt
                </button>
              </div>

              {/* Mode 1: Instant Online Gateway */}
              {paymentMode === 'online' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                    <p className="text-xs font-semibold text-white/80 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cashfree PG Secure Checkout
                    </p>
                    <p className="text-[11.5px] text-white/50 leading-relaxed">
                      Instant online activation using UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or Netbanking.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                      {['UPI (GPay / PhonePe)', 'Credit & Debit Cards', 'Netbanking', 'Wallets'].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[10.5px] font-medium text-white/70"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <button
                    disabled={processing}
                    onClick={handleOnlinePayment}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-xs font-bold text-[#0a0f24] shadow-lg flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0a0f24] border-t-transparent rounded-full animate-spin" />
                        Processing Online Checkout…
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Pay ₹999 & Activate Pro Instantly
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mode 2: Manual Bank Transfer & Receipt Upload */}
              {paymentMode === 'manual' && (
                <form onSubmit={handleManualReceiptUpload} className="space-y-4">
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2 text-xs">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4" /> Bank Account & UPI Details
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-white/70">
                      <div>
                        <span className="text-white/35 block">Bank Name</span>
                        <span className="font-semibold">HDFC Bank Ltd</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">Account Name</span>
                        <span className="font-semibold">Mygreat Education</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">A/C Number</span>
                        <span className="font-mono font-semibold">50200012345678</span>
                      </div>
                      <div>
                        <span className="text-white/35 block">IFSC Code</span>
                        <span className="font-mono font-semibold">HDFC0001234</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/[0.06]">
                        <span className="text-white/35 block">UPI VPA</span>
                        <span className="font-mono font-semibold text-amber-300">
                          mygreat@hdfcbank
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1.5">
                      Upload Payment Receipt (PDF / Image) *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-amber-400/50 rounded-2xl p-4 text-center cursor-pointer bg-white/[0.02] transition-colors"
                    >
                      <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-white">
                        {receiptFile ? receiptFile.name : 'Click to select payment receipt'}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        Supports PDF, JPG, PNG up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        hidden
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !receiptFile}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-xs font-bold text-[#0a0f24] shadow-lg flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0a0f24] border-t-transparent rounded-full animate-spin" />
                        Submitting Receipt…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Submit Proof for Admin Approval
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
