'use client'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Check,
  Clock3,
  Download,
  FileText,
  Flag,
  MessageSquarePlus,
  Plane,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { Link } from '@/lib/navigation'
import {
  actOnWorkflowCaseFn,
  getWorkflowCaseFn,
  setPriorityApplicationFn,
  uploadOfferLetterFn,
  uploadSopFileFn,
} from '@/features/workflow/workflow.functions'
import { cn } from '@/lib/utils'
const label = (value: string) =>
  value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
const decisionStages = new Set([
  'SOP_APPROVED',
  'SOP_CORRECTION_REQUIRED',
  'APPLICATION_ACCEPTED',
  'VISA_APPROVED',
  'VISA_REAPPLY_OR_APPEAL',
])

export default function WorkflowCaseDetail({
  applicationId,
  workflowType,
}: {
  applicationId: string
  workflowType: 'APPLICATION' | 'VISA'
}) {
  const qc = useQueryClient(),
    [visaAttemptId, setVisaAttemptId] = useState<string>(),
    [target, setTarget] = useState(''),
    [note, setNote] = useState(''),
    [offerType, setOfferType] = useState<'CONDITIONAL' | 'UNCONDITIONAL' | ''>(
      '',
    ),
    [offerFile, setOfferFile] = useState<File | null>(null),
    [sopFile, setSopFile] = useState<File | null>(null),
    [expected, setExpected] = useState(''),
    [expectedEnd, setExpectedEnd] = useState(''),
    [nextFollowUp, setNextFollowUp] = useState('')
  const [rejectionType, setRejectionType] = useState<'UNIVERSITY_FINAL' | 'OFFICER_CORRECTION' | 'STUDENT_ACTION' | ''>('')
  const [requiredDocumentIds, setRequiredDocumentIds] = useState<string[]>([])
  const query = useQuery({
    queryKey: ['workflow-case', applicationId, workflowType, visaAttemptId],
    queryFn: () =>
      getWorkflowCaseFn(applicationId, workflowType, visaAttemptId),
  })
  const data = query.data as {requiredDocuments:Array<{id:string;name:string}>}&Record<string,any>
  useEffect(() => {
    if (data) {
      setTarget(
        data.currentStage === 'SOP_CORRECTION_REQUIRED'
          ? 'SOP_VERIFICATION'
          : ['SOP_APPROVED', 'VISA_LEVEL_2_VERIFICATION'].includes(
                data.currentStage,
              )
            ? ''
            : data.currentStage,
      )
      setOfferType(data.offerType || '')
      setRejectionType('')
      setRequiredDocumentIds([])
      if (workflowType === 'VISA' && !visaAttemptId && data.selectedVisaAttempt)
        setVisaAttemptId(data.selectedVisaAttempt.id)
    }
  }, [data?.currentStage])
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['workflow-case'] }),
      qc.invalidateQueries({ queryKey: ['staff', 'queue'] }),
      qc.invalidateQueries({ queryKey: ['staff', 'primary-applications'] }),
    ])
  }
  const followup = useMutation({
    mutationFn: async () => {
      if (
        workflowType === 'APPLICATION' &&
        target === 'SOP_VERIFICATION' &&
        data.currentStage !== 'SOP_VERIFICATION'
      ) {
        if (!sopFile)
          throw new Error('Attach the SOP file before verification.')
        await uploadSopFileFn(applicationId, sopFile, note)
      }
      if (workflowType === 'APPLICATION' && offerType && offerFile)
        await uploadOfferLetterFn(applicationId, offerType, offerFile)
      if (workflowType === 'VISA' && target === 'UNCONDITIONAL_OFFER_RECEIVED' && offerFile)
        await uploadOfferLetterFn(applicationId, 'UNCONDITIONAL', offerFile)
      return actOnWorkflowCaseFn({
        applicationId,
        visaAttemptId,
        workflowType,
        targetStage: target,
        note,
        offerType:
          workflowType === 'VISA' && target === 'UNCONDITIONAL_OFFER_RECEIVED'
            ? 'UNCONDITIONAL'
            : workflowType === 'APPLICATION' &&
          ['APPLICATION_FOLLOW_UP','CONDITIONAL_OFFER_RECEIVED','UNCONDITIONAL_OFFER_RECEIVED'].includes(data.currentStage)
            ? offerType || null
            : undefined,
        expectedCompletionAt: expected
          ? new Date(expected).toISOString()
          : null,
        expectedCompletionEndAt: expectedEnd
          ? new Date(expectedEnd).toISOString()
          : null,
        nextFollowUpAt: nextFollowUp
          ? new Date(nextFollowUp).toISOString()
          : null,
        rejectionType: target === 'APPLICATION_REJECTED' ? rejectionType || undefined : undefined,
        requiredDocumentIds: target === 'APPLICATION_REJECTED' && rejectionType === 'STUDENT_ACTION' ? requiredDocumentIds : undefined,
      })
    },
    onSuccess: async (result: any) => {
      setNote('')
      setOfferFile(null)
      setExpected('')
      setExpectedEnd('')
      setNextFollowUp('')
      setSopFile(null)
      setRejectionType('')
      setRequiredDocumentIds([])
      if (result.selectedVisaAttempt)
        setVisaAttemptId(result.selectedVisaAttempt.id)
      await refresh()
    },
  })
  const priority = useMutation({
    mutationFn: () => setPriorityApplicationFn(applicationId),
    onSuccess: refresh,
  })
  const sopUpload = useMutation({
    mutationFn: (file: File) => uploadSopFileFn(applicationId, file, note || 'SOP file replaced from Related documents.'),
    onSuccess: async () => { setSopFile(null); await refresh() },
  })
  if (query.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.03]" />
  if (query.error || !data)
    return (
      <div className="staff-card rounded-3xl p-8 text-sm text-rose-300">
        {query.error?.message || 'Case not found.'}
      </div>
    )
  const base =
      workflowType === 'APPLICATION' ? '/staff/applications' : '/staff/visas',
    progressStages = data.stages.filter(
      (stage: string) => stage !== 'VISA_REAPPLY_OR_APPEAL',
    ),
    currentIndex = progressStages.indexOf(data.currentStage)
  const validTargets = [data.currentStage, ...data.validNextStages].filter(
    (stage: string) =>
      (!['SOP_PREPARATION','SOP_VERIFICATION','SOP_APPROVED', 'SOP_CORRECTION_REQUIRED'].includes(stage) || data.currentStage === 'SOP_VERIFICATION') &&
      (data.canApprove || !decisionStages.has(stage)) &&
      !(
        workflowType === 'VISA' &&
        ['VISA_LEVEL_1_VERIFICATION', 'VISA_LEVEL_2_VERIFICATION'].includes(
          stage,
        )
      ),
  )
  return (
    <div className="space-y-5">
      <Link
        href={base}
        className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to {workflowType === 'APPLICATION' ? 'applications' : 'visa cases'}
      </Link>
      <section className="staff-hero rounded-3xl border border-white/[.07] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <span
            className={cn(
              'grid size-14 place-items-center rounded-2xl',
              workflowType === 'APPLICATION'
                ? 'bg-sky-400/10 text-sky-300'
                : 'bg-violet-400/10 text-violet-300',
            )}
          >
            {workflowType === 'APPLICATION' ? (
              <FileText className="size-6" />
            ) : (
              <Plane className="size-6" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-amber-300/70">
              {data.studentName} · {workflowType.toLowerCase()} workflow
            </p>
            <div className="mt-2 flex items-center gap-2">
              <h2 className="font-display text-3xl">{data.universityName}</h2>
              {data.isPriority && (
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[8px] font-bold text-slate-950">
                  PRIORITY
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-white/40">
              {data.program} · {data.countryName} ·{' '}
              {data.intake || 'Intake not set'}
            </p>
            <p className="mt-1 text-[9px] text-white/25">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </p>
          </div>
          {!data.isPriority && data.canChangePriority && (
            <button
              onClick={() => priority.mutate()}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 px-4 py-3 text-[10px] font-bold text-amber-300"
            >
              <Flag className="size-3.5" />
              Make priority
            </button>
          )}
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.06] px-5 py-4">
            <p className="text-[8px] uppercase tracking-[.18em] text-white/30">
              Current stage
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-300">
              {label(data.currentStage)}
            </p>
          </div>
        </div>
      </section>
      <section className="staff-card rounded-3xl border border-white/[.07] p-5">
        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/30">
          Applications for this student
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {data.siblings.map((item: any) => (
            <Link
              key={item.id}
              href={`${base}/${item.id}`}
              className={cn(
                'min-w-56 rounded-xl border p-3',
                item.id === applicationId
                  ? 'border-amber-300/30 bg-amber-300/[.08]'
                  : 'border-white/[.07]',
              )}
            >
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-semibold">
                  {item.universityName}
                </p>
                {item.isPriority && (
                  <Flag className="size-3 fill-amber-300 text-amber-300" />
                )}
              </div>
              <p className="mt-1 truncate text-[9px] text-white/35">
                {item.program}
              </p>
              <p className="mt-2 text-[9px] text-amber-300">
                {label(item.applicationStage)}
              </p>
            </Link>
          ))}
        </div>
        {workflowType === 'VISA' && (
          <div className="mt-4 flex gap-2">
            {data.visaAttempts.map((attempt: any) => (
              <button
                key={attempt.id}
                onClick={() => setVisaAttemptId(attempt.id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[9px]',
                  attempt.id === data.selectedVisaAttempt?.id
                    ? 'border-violet-300/30 bg-violet-300/10 text-violet-300'
                    : 'border-white/10 text-white/40',
                )}
              >
                Attempt {attempt.attemptNumber}
                {attempt.isCurrent ? ' · Current' : ''}
              </button>
            ))}
            {!data.visaAttempts.length && (
              <span className="text-[10px] text-white/35">
                Visa not started for this application.
              </span>
            )}
          </div>
        )}
      </section>
      <section className="workflow-progress-card staff-card rounded-3xl border border-white/[.07] p-5">
        <div className="flex justify-between">
          <h3 className="font-display text-xl">Workflow progress</h3>
          <span className="text-xs text-white/35">
            Stage {currentIndex + 1}
          </span>
        </div>
        <div className="mt-6 overflow-x-auto pb-3">
          <div className="flex min-w-max">
            {progressStages.map((stage: string, index: number) => (
              <div key={stage} className="relative w-36 text-center">
                <div
                  className={cn(
                    'workflow-progress-connector absolute left-0 top-4 h-px w-full -translate-x-1/2',
                    index === 0
                      ? 'hidden'
                      : index <= currentIndex
                        ? 'workflow-progress-connector-complete bg-emerald-400'
                        : 'bg-white/10',
                  )}
                />
                <span
                  className={cn(
                    'relative z-10 mx-auto grid size-8 place-items-center rounded-full border text-[10px]',
                    index <= currentIndex
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'workflow-progress-upcoming border-white/12 bg-[#0b1122] text-white/30',
                  )}
                >
                  {index <= currentIndex ? (
                    <Check className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <p className="mt-3 px-2 text-[9px] leading-4">
                  {stage === 'CONDITIONAL_OFFER_RECEIVED'
                    ? offerType === 'UNCONDITIONAL'
                      ? 'Unconditional Offer Received'
                      : offerType === 'CONDITIONAL'
                        ? 'Conditional Offer Received'
                        : 'Conditional / Unconditional Offer Received'
                    : label(stage)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        {data.currentStage === 'APPLICATION_REJECTED_BY_UNIVERSITY' ? <section className="staff-card rounded-3xl border border-rose-400/25 bg-rose-400/[.055] p-6"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-400/10 text-rose-300"><AlertTriangle className="size-5"/></span><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-rose-300">Application closed</p><h3 className="mt-1 font-display text-xl">Final rejection by university</h3><p className="mt-2 text-xs leading-5 text-white/45">This application cannot receive further follow-ups. The student has been notified of the university’s final decision.</p></div></div></section> : <section className="staff-card rounded-3xl border border-white/[.07] p-5">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="size-4 text-amber-300" />
            <h3 className="font-display text-xl">Add follow-up</h3>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block text-[9px] text-white/40">
              Stage
              <select
                value={target}
                onChange={(event) => {setTarget(event.target.value);if(workflowType==='VISA'&&event.target.value==='UNCONDITIONAL_OFFER_RECEIVED')setOfferType('UNCONDITIONAL')}}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0c1122] p-3 text-xs"
              >
                {['SOP_APPROVED', 'VISA_LEVEL_2_VERIFICATION'].includes(
                  data.currentStage,
                ) && (
                  <option value="" disabled>
                    Select
                  </option>
                )}
                {validTargets.map((stage: string) => (
                  <option key={stage} value={stage}>
                    {label(stage)}
                  </option>
                ))}
              </select>
            </label>
            {workflowType === 'APPLICATION' && target === 'APPLICATION_REJECTED' && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.035] p-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300"/><div><p className="text-xs font-bold">Why was the application rejected?</p><p className="mt-1 text-[9px] leading-4 text-white/40">Choose carefully. A final university rejection permanently closes this application.</p></div></div><div className="mt-4 space-y-2">{([
              ['UNIVERSITY_FINAL','Final rejection by university','The application cannot proceed and no more follow-ups will be allowed.'],
              ['OFFICER_CORRECTION','Application officer correction','Staff will correct the issue and resubmit using the existing workflow.'],
              ['STUDENT_ACTION','Urgent student action required','Select documents the student must replace before staff can resubmit.'],
            ] as const).map(([value,title,description])=><button type="button" key={value} onClick={()=>{setRejectionType(value);if(value!=='STUDENT_ACTION')setRequiredDocumentIds([])}} className={cn('w-full rounded-xl border p-3 text-left transition',rejectionType===value?'border-rose-400/45 bg-rose-400/10':'border-white/10 hover:border-white/20')}><div className="flex items-start gap-3"><span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',rejectionType===value?'border-rose-400 bg-rose-400':'border-white/25')}>{rejectionType===value&&<Check className="size-3 text-slate-950"/>}</span><span><span className="block text-[10px] font-bold">{title}</span><span className="mt-1 block text-[9px] leading-4 text-white/40">{description}</span></span></div></button>)}</div>{rejectionType==='STUDENT_ACTION'&&<div className="mt-4 border-t border-rose-400/15 pt-4"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-rose-300">Documents requiring urgent replacement</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{data.requiredDocuments.map(document=>{const selected=requiredDocumentIds.includes(document.id);return <button type="button" aria-pressed={selected} key={document.id} onClick={()=>setRequiredDocumentIds(current=>current.includes(document.id)?current.filter(id=>id!==document.id):[...current,document.id])} className={cn('flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[9px] transition',selected?'border-rose-400/40 bg-rose-400/10':'border-white/10 hover:border-rose-400/25 hover:bg-rose-400/[.035]')}><span className={cn('grid size-4 shrink-0 place-items-center rounded border',selected?'border-rose-400 bg-rose-400':'border-white/20')}>{selected&&<Check className="size-3 text-slate-950"/>}</span><span className="leading-4">{document.name}</span></button>})}</div></div>}</div>}
            {workflowType === 'APPLICATION' &&
              ['APPLICATION_FOLLOW_UP','CONDITIONAL_OFFER_RECEIVED','UNCONDITIONAL_OFFER_RECEIVED','MOVE_TO_VISA'].includes(data.currentStage) && (
                <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-semibold text-white/45">
                      Offer received
                    </p>
                    {target === 'MOVE_TO_VISA' && <span className="text-[8px] text-white/30">REQUIRED</span>}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(['CONDITIONAL', 'UNCONDITIONAL'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        disabled={data.currentStage!=='APPLICATION_FOLLOW_UP'}
                        onClick={() => {
                          setOfferType(type)
                          if (type !== data.offerType) setOfferFile(null)
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-2.5 text-[9px] font-semibold disabled:cursor-default',
                          offerType === type
                            ? 'border-amber-400 bg-amber-400 text-slate-950'
                            : 'border-white/10 text-white/55',
                        )}
                      >
                        {type === 'CONDITIONAL'
                          ? 'Conditional Offer Received'
                          : 'Unconditional Offer Received'}
                      </button>
                    ))}
                  </div>
                  {offerType && data.currentStage==='APPLICATION_FOLLOW_UP' && (
                    <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-amber-300/30 p-3 text-[9px]">
                      <Upload className="size-3.5 text-amber-300" />
                      <span className="flex-1 truncate">
                        {offerFile?.name ||
                          data.offerLetterName ||
                          'Upload offer letter (PDF, DOC, DOCX)'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(event) =>
                          setOfferFile(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                  {data.offerLetterId&&<div className="mt-3 grid grid-cols-2 gap-2"><a target="_blank" rel="noreferrer" href={`/api/workflow?offerLetterId=${encodeURIComponent(data.offerLetterId)}&preview=1`} className="flex items-center justify-center gap-2 rounded-lg border border-sky-300/25 py-2.5 text-[9px] font-semibold text-sky-300"><FileText className="size-3.5"/>View letter</a><a href={`/api/workflow?offerLetterId=${encodeURIComponent(data.offerLetterId)}`} className="flex items-center justify-center gap-2 rounded-lg border border-amber-300/25 py-2.5 text-[9px] font-semibold text-amber-300"><Download className="size-3.5"/>Download</a></div>}
                </div>
              )}
            {workflowType==='VISA'&&data.offerType==='CONDITIONAL'&&target==='UNCONDITIONAL_OFFER_RECEIVED'&&<div className="rounded-xl border border-amber-400/20 bg-amber-400/[.04] p-4"><p className="text-[10px] font-bold text-amber-200">Unconditional offer letter · Required</p><p className="mt-1 text-[9px] leading-4 text-white/40">Upload the final unconditional offer before continuing to tuition fee payment.</p><label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-amber-300/30 p-3 text-[9px]"><Upload className="size-3.5 text-amber-300"/><span className="min-w-0 flex-1 truncate">{offerFile?.name||'Upload unconditional offer (PDF, DOC, DOCX)'}</span><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={event=>setOfferFile(event.target.files?.[0]||null)}/></label></div>}
            {workflowType === 'APPLICATION' &&
              target === 'SOP_VERIFICATION' &&
              data.currentStage !== 'SOP_VERIFICATION' && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300/30 bg-amber-300/[.04] p-4 text-xs">
                  <Upload className="size-4 text-amber-300" />
                  <span className="flex-1 truncate">
                    {sopFile?.name || 'Attach SOP file (PDF, DOC, or DOCX)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(event) =>
                      setSopFile(event.target.files?.[0] || null)
                    }
                  />
                </label>
              )}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Notes or description"
              className="w-full rounded-xl border border-white/10 bg-white/[.035] p-3 text-xs outline-none"
            />
            {workflowType === 'VISA' && target === 'VISA_SLOT_BOOKING' && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Calendar className="size-4" />
                  <span>Select Booked Visa Slot Appointment Date & Time *</span>
                </div>
                <p className="text-[9.5px] text-white/50 leading-relaxed">
                  Specify the exact date and time for the student's visa slot appointment.
                </p>
                <input
                  required
                  type="datetime-local"
                  value={expected}
                  onChange={(event) => setExpected(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-amber-400/40 bg-[#090f20] p-3 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[9px] text-white/40">
                Expected completion
                <input
                  type="datetime-local"
                  value={expected}
                  onChange={(event) => setExpected(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.035] p-3 text-xs"
                />
              </label>
              <label className="text-[9px] text-white/40">
                Next follow-up
                <input
                  type="datetime-local"
                  value={nextFollowUp}
                  onChange={(event) => setNextFollowUp(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.035] p-3 text-xs"
                />
              </label>
            </div>
            <button
              disabled={
                followup.isPending ||
                !target ||
                (workflowType==='VISA'&&target==='UNCONDITIONAL_OFFER_RECEIVED'&&!offerFile) ||
                (workflowType==='VISA'&&target==='VISA_SLOT_BOOKING'&&!expected) ||
                (workflowType === 'APPLICATION' &&
                  target === 'MOVE_TO_VISA' &&
                  !offerType) ||
                (workflowType === 'APPLICATION' &&
                  Boolean(offerType) &&
                  (offerType !== data.offerType || !data.offerLetterId) &&
                  !offerFile) ||
                (workflowType === 'APPLICATION' &&
                  target === 'SOP_VERIFICATION' &&
                  data.currentStage !== 'SOP_VERIFICATION' &&
                  !sopFile) ||
                (target === 'APPLICATION_REJECTED' && (!rejectionType || !note.trim())) ||
                (target === 'APPLICATION_REJECTED' && rejectionType === 'STUDENT_ACTION' && requiredDocumentIds.length === 0) ||
                (!note.trim() &&
                  target === data.currentStage &&
                  offerType === (data.offerType ?? ''))
              }
              onClick={() => followup.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-[10px] font-bold text-slate-950"
            >
              Save follow-up
              <ArrowRight className="size-3.5" />
            </button>
            {followup.error && (
              <p className="text-xs text-rose-300">{followup.error.message}</p>
            )}
          </div>
        </section>}
        <section className="staff-card rounded-3xl border border-white/[.07] p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-indigo-300" />
            <h3 className="font-display text-xl">Follow-up history</h3>
          </div>
          <div className="mt-5 max-h-[520px] space-y-4 overflow-y-auto">
            {data.events.map((event: any) => (
              <div key={event.id} className="border-l border-white/10 pl-4">
                <div className="flex justify-between gap-3">
                  <p className="text-[10px] font-bold text-amber-300">
                    {label(event.stage)}
                    {event.attemptNumber
                      ? ` · Attempt ${event.attemptNumber}`
                      : ''}
                    {event.outcome ? ` · ${label(event.outcome)}` : ''}
                  </p>
                  <time className="text-[8px] text-white/25">
                    {new Date(event.followedUpAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-[9px] text-white/35">
                  By {event.createdByName}
                  {event.assignedStaffName
                    ? ` · Assigned to ${event.assignedStaffName}`
                    : ''}
                </p>
                {event.expectedCompletionAt && (
                  <p className="mt-1 text-[9px] text-sky-300">
                    Expected{' '}
                    {new Date(event.expectedCompletionAt).toLocaleString()}
                  </p>
                )}
                {event.notes && (
                  <p className="mt-2 rounded-xl bg-white/[.03] p-3 text-xs leading-5 text-white/65">
                    {event.notes}
                  </p>
                )}
              </div>
            ))}
            {!data.events.length && (
              <p className="py-12 text-center text-xs text-white/30">
                No follow-ups yet.
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="staff-card rounded-3xl border border-white/[.07] p-5">
          <h3 className="font-display text-lg">Related tasks</h3>
          <div className="mt-4 space-y-2">
            {data.tasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-white/[.06] p-3"
              >
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full',
                    task.completed
                      ? 'bg-emerald-400 text-slate-950'
                      : 'border border-white/15',
                  )}
                >
                  {task.completed && <Check className="size-3" />}
                </span>
                <p className="flex-1 text-[10px]">{task.label}</p>
              </div>
            ))}
            {!data.tasks.length && (
              <p className="text-[10px] text-white/30">
                No application-specific tasks.
              </p>
            )}
          </div>
        </section>
        <section className="staff-card rounded-3xl border border-white/[.07] p-5">
          <h3 className="font-display text-lg">Related documents</h3>
          <div className="mt-4 space-y-2">
            {data.documents.map((document: any) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-xl border border-white/[.06] p-3"
              >
                <p className="text-[10px]">{document.name}</p>
                <span className="text-[9px] text-amber-300">
                  {label(document.status)}
                </span>
              </div>
            ))}
            {!data.documents.length && (
              <p className="text-[10px] text-white/30">
                No application-specific documents.
              </p>
            )}
          </div>
        </section>
      </div>
      {false &&
        workflowType === 'APPLICATION' &&
        ['SOP_PREPARATION', 'SOP_CORRECTION_REQUIRED'].includes(
          data.currentStage,
        ) && (
          <section className="staff-card rounded-3xl border border-amber-300/20 p-5">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-amber-300" />
              <h3 className="font-display text-xl">SOP document</h3>
            </div>
            <p className="mt-2 text-xs text-white/40">
              Attach the prepared SOP before sending this application to SOP
              Verification.
            </p>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300/30 bg-amber-300/[.04] p-4 text-xs">
              <FileText className="size-4 text-amber-300" />
              <span className="flex-1 truncate">
                {sopFile?.name || 'Choose PDF, DOC, or DOCX · max 10 MB'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(event) =>
                  setSopFile(event.target.files?.[0] || null)
                }
              />
            </label>
            {sopFile && (
              <button
                disabled={sopUpload.isPending}
                onClick={() => sopFile && sopUpload.mutate(sopFile)}
                className="mt-3 rounded-xl bg-amber-400 px-5 py-3 text-[10px] font-bold text-slate-950"
              >
                {sopUpload.isPending ? 'Uploading…' : 'Attach SOP file'}
              </button>
            )}
            {sopUpload.error && (
              <p className="mt-2 text-xs text-rose-300">
                {sopUpload.error?.message}
              </p>
            )}
          </section>
        )}
      {workflowType === 'APPLICATION' &&
        data.currentStage === 'SOP_VERIFICATION' && (
          <section className="staff-card rounded-3xl border border-amber-300/20 bg-amber-300/[.04] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-amber-300" />
              <div>
                <h3 className="font-display text-xl">SOP approval pending</h3>
                <p className="mt-1 text-xs text-white/45">
                  {data.canApprove
                    ? 'Review the SOP attachment in the history and choose SOP Approved or SOP Correction Required above.'
                    : 'This request has been sent to the Super Admin dashboard.'}
                </p>
              </div>
            </div>
          </section>
        )}
      {workflowType === 'APPLICATION' &&
        data.events.some((event: any) => event.attachments?.length) && (
          <section className="staff-card rounded-3xl border border-white/[.07] p-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-lg">SOP attachment</h3><p className="mt-1 text-[10px] text-white/35">Preview, download, or replace the current statement of purpose.</p></div><ShieldCheck className="size-5 text-amber-300"/></div>
            <div className="mt-4 space-y-2">
              {data.events
                .flatMap((event: any) => event.attachments || [])
                .map((file: any) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4"
                  >
                    <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><FileText className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{file.fileName}</p><p className="mt-1 text-[9px] text-white/35">{Math.ceil(file.sizeBytes / 1024)} KB · {file.mimeType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf') ? 'PDF preview available' : 'Document download'}</p></div></div>
                    <div className="mt-4 grid grid-cols-3 gap-2"><a target="_blank" rel="noreferrer" href={`/api/workflow?workflowFileId=${encodeURIComponent(file.id)}&preview=1`} className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-300/25 px-3 py-2.5 text-[9px] font-bold text-sky-300"><FileText className="size-3.5"/>View</a><a href={`/api/workflow?workflowFileId=${encodeURIComponent(file.id)}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-[9px] font-bold text-white/60"><Download className="size-3.5"/>Download</a><label className={cn('flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300/25 px-3 py-2.5 text-[9px] font-bold text-amber-300',sopUpload.isPending&&'pointer-events-none opacity-45')}><RefreshCw className={cn('size-3.5',sopUpload.isPending&&'animate-spin')}/>{sopUpload.isPending?'Replacing…':'Replace'}<input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event)=>{const replacement=event.target.files?.[0];if(replacement)sopUpload.mutate(replacement);event.target.value='' }}/></label></div>
                  </div>
                ))}
            </div>
            {sopUpload.error&&<p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{sopUpload.error.message}</p>}
          </section>
        )}
    </div>
  )
}
