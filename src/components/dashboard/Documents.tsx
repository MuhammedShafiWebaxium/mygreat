import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, Clock, Download, FileText, LoaderCircle, RefreshCw, ShieldCheck, Upload } from 'lucide-react'
import { REQUIRED_DOCUMENTS, type RequiredDocumentId } from '@/lib/local-documents'
import { uploadRequiredDocumentFn } from '@/features/workflow/workflow.functions'
import { Bar, fadeUp, Panel, PanelTitle } from './bits'

type ServerDocument = { id: string; name: string; status: string; note: string; storageKey: string | null }

export default function Documents({ documents, onChanged }: { documents: ServerDocument[]; onChanged: () => Promise<unknown> }) {
  const [target, setTarget] = useState<RequiredDocumentId>('passport')
  const [error, setError] = useState('')
  const [uploadingId, setUploadingId] = useState<RequiredDocumentId | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const uploaded = REQUIRED_DOCUMENTS.filter((required) => documents.some((document) => document.name === required.name && document.storageKey)).length
  const verified = REQUIRED_DOCUMENTS.filter((required) => documents.some((document) => document.name === required.name && document.status === 'VERIFIED')).length
  const allUploaded = uploaded === REQUIRED_DOCUMENTS.length
  const allVerified = verified === REQUIRED_DOCUMENTS.length
  const allSubmittedForReview = allUploaded && REQUIRED_DOCUMENTS.every((required) => documents.some((document) => document.name === required.name && ['PENDING', 'VERIFIED'].includes(document.status)))
  const verificationProgress = verified / REQUIRED_DOCUMENTS.length * 100

  const choose = (id: RequiredDocumentId) => {
    if (uploadingId) return
    setTarget(id)
    setError('')
    window.setTimeout(() => input.current?.click(), 0)
  }
  const upload = async (file?: File) => {
    if (!file) return
    try {
      setUploadingId(target)
      await uploadRequiredDocumentFn(target, file)
      await onChanged()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploadingId(null)
      if (input.current) input.current.value = ''
    }
  }

  return <div className="document-center max-w-5xl space-y-5">
    <motion.div variants={fadeUp} initial="hidden" animate="show"><h2 className="font-display text-2xl font-light sm:text-3xl">Required <span className="text-gradient-gold font-medium">documents</span></h2><p className="mt-1.5 text-sm text-white/45">Upload all {REQUIRED_DOCUMENTS.length} documents before your application can be reviewed.</p></motion.div>

    {allSubmittedForReview && !allVerified && <motion.section variants={fadeUp} initial="hidden" animate="show" role="status" className="overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[.13] via-amber-300/[.06] to-transparent p-5 shadow-[0_18px_45px_-28px_rgba(245,158,11,.8)] sm:p-6"><div className="flex items-start gap-4"><span className="relative grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300"><LoaderCircle className="size-6 animate-spin"/><span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#10172a] bg-amber-400"/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-300/75">Verification in progress</p><h3 className="mt-1 font-display text-xl text-white sm:text-2xl">All documents are under review</h3><p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/50">Your {REQUIRED_DOCUMENTS.length} required documents were uploaded successfully. Our team is checking them now; you’ll see each item change to Verified after approval.</p><div className="mt-4 flex items-center gap-2 text-[10px] font-semibold sm:gap-3"><span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-300">Uploaded</span><span className="h-px w-5 bg-amber-400/35"/><span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-amber-300">Staff review</span><span className="h-px w-5 bg-white/10"/><span className="rounded-full border border-white/10 px-3 py-1.5 text-white/35">Ready to apply</span></div></div></div></motion.section>}

    {allVerified && <motion.section variants={fadeUp} initial="hidden" animate="show" role="status" className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[.09] p-5 sm:p-6"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><ShieldCheck className="size-6"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300/75">Verification complete</p><h3 className="mt-1 font-display text-xl">Your documents are ready</h3><p className="mt-1 text-xs text-white/45">All required documents have been approved. You can now proceed with applications.</p></div></div></motion.section>}

    <Panel className="flex items-center gap-4 p-5"><ShieldCheck className="size-6 text-amber-300"/><div className="flex-1"><div className="flex justify-between text-xs"><span>{uploaded}/{REQUIRED_DOCUMENTS.length} uploaded · {verified}/{REQUIRED_DOCUMENTS.length} verified</span><span>{Math.round(verificationProgress)}% verified</span></div><Bar value={verificationProgress} className="mt-2"/></div></Panel>
    {error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
    <Panel><PanelTitle>Application prerequisites</PanelTitle><div className="grid gap-3 px-4 pb-5 sm:grid-cols-2">{REQUIRED_DOCUMENTS.map((required) => {
      const document = documents.find((item) => item.name === required.name)
      const isVerified = document?.status === 'VERIFIED'
      const isPending = document?.status === 'PENDING'
      const replacementRequired = document?.status === 'NEEDED' || document?.status === 'REJECTED'
      const isUploading = uploadingId === required.id
      const hasFile = Boolean(document?.storageKey)
      return <article key={required.id} className={`document-card rounded-2xl border p-4 transition ${replacementRequired ? 'document-card-danger border-rose-400/35 bg-rose-400/[.055]' : 'border-white/[.08]'}`}>
        <div className="flex gap-3"><div className={`grid size-10 shrink-0 place-items-center rounded-xl border ${replacementRequired ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : isVerified ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : isPending ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-dashed border-white/15 text-white/35'}`}>{isUploading ? <LoaderCircle className="size-4 animate-spin"/> : replacementRequired ? <AlertTriangle className="size-4"/> : isVerified ? <Check className="size-4"/> : isPending ? <Clock className="size-4"/> : <FileText className="size-4"/>}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{required.name}</p><p className={`mt-1 text-[10px] ${replacementRequired ? 'font-semibold text-rose-300' : 'text-white/40'}`}>{isUploading ? 'Uploading file…' : replacementRequired ? 'Replacement required by staff' : isVerified ? 'Verified' : isPending ? 'Uploaded · under verification' : 'Upload required'}</p></div></div>
        {replacementRequired && <div role="alert" className="document-replacement-alert mt-4 flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-400/[.09] p-3 text-rose-200"><AlertTriangle className="mt-0.5 size-4 shrink-0"/><div><p className="text-[11px] font-bold">A replacement file is required</p><p className="mt-1 text-[10px] leading-4 text-rose-200/75">{document?.note || 'Staff could not approve the previous file. Upload a clear and valid replacement.'}</p></div></div>}
        <div className="mt-4 flex gap-2"><button disabled={Boolean(uploadingId)} onClick={() => choose(required.id)} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-bold transition disabled:cursor-wait disabled:opacity-50 ${hasFile ? replacementRequired ? 'document-replace-danger border border-rose-400/35 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20' : 'document-replace-button border border-white/12 bg-transparent text-white/65 hover:border-amber-400/35 hover:text-amber-300' : 'document-upload-button bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 hover:bg-amber-300'}`}>{isUploading ? <><LoaderCircle className="size-3.5 animate-spin"/>Uploading…</> : hasFile ? <><RefreshCw className="size-3.5"/>{replacementRequired ? 'Upload replacement' : 'Replace file'}</> : <><Upload className="size-3.5"/>Upload file</>}</button>{hasFile && <a href={`/api/workflow?documentId=${document!.id}`} className="icon" title="Download current file"><Download className="size-4"/></a>}</div>
      </article>
    })}</div></Panel>
    <input ref={input} type="file" hidden accept={REQUIRED_DOCUMENTS.find((item) => item.id === target)?.accept} onChange={(event) => upload(event.target.files?.[0])}/>
  </div>
}
