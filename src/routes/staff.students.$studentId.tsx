import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Clock3, Download, ExternalLink, FileText, GraduationCap, Mail, Phone, RefreshCw, ShieldCheck } from 'lucide-react'
import { DesiredUniversities } from '@/components/staff/DesiredUniversities'
import { getStudentDetailFn } from '@/features/admin/detail.functions'
import { reviewDocumentFn } from '@/features/workflow/workflow.functions'
import { REQUIRED_DOCUMENTS } from '@/lib/local-documents'
import { Link } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import type { Country } from '@/types'

export const Route = createFileRoute('/staff/students/$studentId')({
  loader: ({ params }) => getStudentDetailFn({ data: params.studentId }),
  component: StudentDetail,
})

type DocumentItem = { id: string; name: string; status: string; note: string; storageKey: string | null }

function RequiredDocuments({ documents, onReview }: { documents: DocumentItem[]; onReview: (id: string, status: 'VERIFIED' | 'NEEDED') => Promise<void> }) {
  const [reviewingId, setReviewingId] = useState('')
  const required = REQUIRED_DOCUMENTS.map(item => ({ ...item, document: documents.find(document => document.name === item.name) }))
  const uploaded = required.filter(item => item.document?.storageKey).length
  const verified = required.filter(item => item.document?.status === 'VERIFIED').length
  const pending = required.filter(item => item.document?.status === 'PENDING').length
  const progress = verified / REQUIRED_DOCUMENTS.length * 100

  const review = async (id: string, status: 'VERIFIED' | 'NEEDED') => {
    try { setReviewingId(id); await onReview(id, status) } finally { setReviewingId('') }
  }

  return <section className="staff-card overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]">
    <header className="border-b border-white/[.07] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-300"/><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Application prerequisites</p></div><h3 className="mt-1.5 font-display text-2xl">Required documents</h3><p className="mt-1 text-xs text-white/38">Review each uploaded file before this student can submit an application.</p></div>
        <div className="flex gap-2"><span className="rounded-xl border border-white/[.08] bg-white/[.035] px-3 py-2 text-[10px] font-semibold text-white/55"><strong className="mr-1 text-sm text-white">{uploaded}</strong>/ 4 uploaded</span><span className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-2 text-[10px] font-semibold text-emerald-300"><strong className="mr-1 text-sm">{verified}</strong>/ 4 verified</span></div>
      </div>
      <div className="mt-5"><div className="mb-2 flex justify-between text-[10px]"><span className="text-white/38">Verification progress</span><span className="font-semibold text-white/65">{Math.round(progress)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all" style={{width:`${progress}%`}}/></div></div>
      {pending>0&&<div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[.07] px-3 py-2.5 text-[11px] text-amber-200"><Clock3 className="size-3.5"/><strong>{pending} {pending===1?'document is':'documents are'} waiting for your review.</strong></div>}
    </header>

    <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">{required.map(({id,name,document},index)=>{
      const status=document?.status??'MISSING'
      const verified=status==='VERIFIED',pending=status==='PENDING',needsReplacement=status==='NEEDED'||status==='REJECTED'
      const Icon=verified?CheckCircle2:pending?Clock3:needsReplacement?RefreshCw:AlertCircle
      return <article key={id} className={cn('relative overflow-hidden rounded-2xl border p-4 transition sm:p-5',verified?'border-emerald-400/20 bg-emerald-400/[.035]':pending?'border-amber-400/25 bg-amber-400/[.045]':needsReplacement?'border-rose-400/20 bg-rose-400/[.035]':'border-dashed border-white/10 bg-white/[.015]')}>
        <div className="flex items-start gap-3.5"><span className={cn('grid size-10 shrink-0 place-items-center rounded-xl border',verified?'border-emerald-400/25 bg-emerald-400/10 text-emerald-300':pending?'border-amber-400/25 bg-amber-400/10 text-amber-300':needsReplacement?'border-rose-400/25 bg-rose-400/10 text-rose-300':'border-white/10 bg-white/[.035] text-white/30')}><Icon className="size-4.5"/></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/25">Document {String(index+1).padStart(2,'0')}</p><h4 className="mt-1 text-sm font-semibold">{name}</h4></div><span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide',verified?'border-emerald-400/25 bg-emerald-400/10 text-emerald-300':pending?'border-amber-400/25 bg-amber-400/10 text-amber-300':needsReplacement?'border-rose-400/25 bg-rose-400/10 text-rose-300':'border-white/10 text-white/30')}>{verified?'Verified':pending?'Review needed':needsReplacement?'Replacement requested':'Not uploaded'}</span></div><p className="mt-2 min-h-4 text-[10.5px] text-white/38">{document?.note||(document?'Uploaded by student.':'Waiting for the student to upload this file.')}</p></div></div>
        {document?.storageKey&&<div className="mt-4 flex flex-col gap-2 border-t border-white/[.06] pt-4 sm:flex-row"><a href={`/api/workflow?documentId=${document.id}`} target="_blank" rel="noreferrer" className="action flex flex-1 items-center justify-center gap-2"><Download className="size-3.5"/>Open document<ExternalLink className="size-3"/></a>{pending&&<><button disabled={reviewingId===document.id} onClick={()=>review(document.id,'VERIFIED')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-[11px] font-bold text-[#07140f] transition hover:bg-emerald-300 disabled:opacity-50"><Check className="size-3.5"/>Approve</button><button disabled={reviewingId===document.id} onClick={()=>review(document.id,'NEEDED')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/25 px-4 py-2.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50"><RefreshCw className="size-3.5"/>Replace</button></>}{verified&&<button disabled={reviewingId===document.id} onClick={()=>review(document.id,'NEEDED')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-[11px] font-semibold text-white/48 transition hover:border-rose-400/25 hover:bg-rose-400/[.07] hover:text-rose-300 disabled:opacity-50"><RefreshCw className="size-3.5"/>Request replacement</button>}</div>}
      </article>
    })}</div>
  </section>
}

function StudentDetail() {
  const student = Route.useLoaderData()
  const country = student.profile?.destinationCountry as Country | null
  const review = async (documentId: string, status: 'VERIFIED' | 'NEEDED') => { await reviewDocumentFn({documentId,status}); window.location.reload() }
  return <div className="space-y-5">
    <Link href="/staff/students" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-amber-300"><ArrowLeft className="size-4"/>Back to students</Link>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><h2 className="font-display text-3xl">{student.name}</h2><div className="mt-3 flex flex-wrap gap-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><Mail className="size-3.5"/>{student.email}</span><span className="flex items-center gap-1.5"><Phone className="size-3.5"/>{student.phone||'Not provided'}</span></div></section>
    <section className="grid gap-5 xl:grid-cols-2"><div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><GraduationCap className="size-4 text-amber-300"/><h3 className="font-display text-xl">Academic profile</h3></div><dl className="mt-5 grid grid-cols-2 gap-5 text-xs">{[['Destination',country?.name||'Not selected'],['Education',student.profile?.educationLevel||'Not provided'],['Degree',student.profile?.degree||'Not provided'],['Field',student.profile?.field||'Not provided'],['GPA',student.profile?.gpa?String(student.profile.gpa):'Not provided'],['Intake',student.profile?.preferredIntake||'Not provided']].map(([label,value])=><div key={label}><dt className="text-[9px] uppercase tracking-[.15em] text-white/30">{label}</dt><dd className="mt-1.5 text-white/75">{value}</dd></div>)}</dl></div><DesiredUniversities studentId={student.id} universities={student.shortlist.map(({university})=>university)} appliedUniversityIds={[...new Set(student.applications.map(application=>application.universityId))]}/></section>
    <RequiredDocuments documents={student.documents} onReview={review}/>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex items-center gap-2"><FileText className="size-4 text-violet-300"/><h3 className="font-display text-xl">Applications</h3></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{student.applications.map(application=><div key={application.id} className="rounded-2xl border border-white/[.07] p-4"><p className="text-sm font-semibold">{application.university.name}</p><p className="mt-1 text-xs text-white/40">{application.program}</p><p className="mt-3 text-[10px] text-sky-300">{application.status.replaceAll('_',' ')} · {application.progress}%</p></div>)}</div></section>
  </div>
}
