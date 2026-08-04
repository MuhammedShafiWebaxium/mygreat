'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  Download,
  Eye,
  GraduationCap,
  Plane,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  documentReviewQueueQuery,
  staffQueueQuery,
  staffStudentsQuery,
} from '@/features/admin/admin.queries'
import { cn } from '@/lib/utils'
import {
  actOnWorkflowCaseFn,
  getWorkflowApprovalQueueFn,
} from '@/features/workflow/workflow.functions'

function statusLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function StaffOverview() {
  const queryClient = useQueryClient()
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [selectedApproval, setSelectedApproval] = useState<any>(null)
  const { data: queue } = useSuspenseQuery(staffQueueQuery)
  const { data: documentReviews } = useSuspenseQuery(documentReviewQueueQuery)
  const { data: students } = useSuspenseQuery(staffStudentsQuery)
  const { data: approvals = [] } = useQuery({
    queryKey: ['workflow-approval-queue'],
    queryFn: getWorkflowApprovalQueueFn,
  })
  const decideSop = useMutation({
    mutationFn: ({
      applicationId,
      workflowType,
      visaAttemptId,
      targetStage,
      outcome,
      approvalStage,
      approvalRequestId,
      note,
    }: {
      applicationId: string
      workflowType: 'APPLICATION' | 'VISA'
      visaAttemptId?: string
      targetStage: string
      outcome?: string
      approvalStage?: 'VISA_LEVEL_1_VERIFICATION'|'VISA_LEVEL_2_VERIFICATION'
      approvalRequestId?: string
      note: string
    }) =>
      actOnWorkflowCaseFn({
        applicationId,
        workflowType,
        visaAttemptId,
        targetStage,
        outcome,
        approvalStage,
        approvalRequestId,
        note,
      }),
    onSuccess: async () => {
      setSelectedApproval(null)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['workflow-approval-queue'],
        }),
        queryClient.invalidateQueries({ queryKey: ['workflow-case'] }),
        queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['staff', 'primary-applications'] }),
      ])
    },
  })
  const activeStudents = students.filter((student) => student.active).length
  const underReview = queue.filter(
    (item) => item.status === 'APPLICATION_FOLLOW_UP',
  ).length
  const offers = queue.filter((item) => ['CONDITIONAL_OFFER_RECEIVED','MOVE_TO_VISA'].includes(item.status)).length
  const visaActive = queue.filter(
    (item) => Boolean(item.visaStatus && item.visaStatus !== 'VISA_GRANTED'),
  ).length
  const averageProgress = queue.length
    ? Math.round(
        queue.reduce((total, item) => total + item.progress, 0) / queue.length,
      )
    : 0
  const priority = [...queue]
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5)

  const stats = [
    {
      label: 'Active students',
      value: activeStudents,
      note: `${students.length} total students`,
      icon: Users,
      tone: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20',
    },
    {
      label: 'Under review',
      value: underReview,
      note: 'Awaiting decisions',
      icon: FileSearch,
      tone: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
    },
    {
      label: 'Offers received',
      value: offers,
      note: 'Positive outcomes',
      icon: GraduationCap,
      tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    },
    {
      label: 'Visa in progress',
      value: visaActive,
      note: 'Cases being prepared',
      icon: Plane,
      tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    },
  ]

  return (
    <div className="space-y-5">
      <section className="staff-hero relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.12] via-white/[0.035] to-amber-400/[0.08] p-6 sm:p-8">
        <div className="aurora -right-20 -top-40 size-96 bg-amber-400/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.08] px-3 py-1.5 text-[10px] font-semibold text-amber-200">
              <Sparkles className="size-3" /> Today’s operations pulse
            </div>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-light leading-tight sm:text-4xl">
              Keep every student moving{' '}
              <span className="text-gradient-gold font-medium">
                toward an offer.
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">
              Your team has {queue.length} active{' '}
              {queue.length === 1 ? 'case' : 'cases'}. Prioritize stalled
              applications, unblock document reviews, and keep visa handoffs
              visible.
            </p>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <div className="grid size-20 place-items-center rounded-full border-[7px] border-amber-400/25">
              <span className="font-display text-2xl text-amber-200">
                {averageProgress}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">Average progress</p>
              <p className="mt-1 max-w-[160px] text-[11px] leading-5 text-white/35">
                Across all applications currently in your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="staff-card rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
          >
            <div
              className={cn(
                'grid size-10 place-items-center rounded-xl border',
                stat.tone,
              )}
            >
              <stat.icon className="size-4.5" />
            </div>
            <p className="mt-4 font-display text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold text-white/65">
              {stat.label}
            </p>
            <p className="mt-1 text-[10.5px] text-white/30">{stat.note}</p>
          </div>
        ))}
      </section>

      {approvals.length > 0 && (
        <section className="staff-card overflow-hidden rounded-3xl border border-amber-300/20 bg-amber-300/[.035]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-amber-300" />
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300/70">
                  Super Admin approvals
                </p>
              </div>
              <h3 className="mt-1 font-display text-xl">
                Workflow approvals awaiting verification
              </h3>
            </div>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold text-slate-950">
              {approvals.length} pending
            </span>
          </div>
          <div className="divide-y divide-white/[.055] px-4 pb-3">
            {approvals.slice(0, 6).map((item: any) => (
              <div
                key={item.id}
                className="grid gap-4 rounded-xl px-3 py-4 transition hover:bg-white/[.03] sm:grid-cols-[1fr_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">{item.studentName}</p>
                  <p className="mt-1 text-[10px] text-white/35">
                    {item.program}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/65">{item.universityName}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    Sent by {item.requestedByName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApproval(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/25 bg-amber-300/[.08] px-4 py-2.5 text-[10px] font-bold text-amber-300"
                >
                  <Eye className="size-3.5" />
                  View
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="staff-card overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-amber-300" />
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">
                Document verification
              </p>
            </div>
            <h3 className="mt-1 font-display text-xl">
              Students with uploaded documents
            </h3>
          </div>
          <Link
            href="/staff/students"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-300"
          >
            View all students <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-white/[.055] px-3 pb-3 sm:px-4">
          {documentReviews.slice(0, 6).map((student) => (
            <Link
              key={student.studentId}
              href={`/staff/students/${student.studentId}`}
              className="group grid gap-3 rounded-xl px-3 py-4 transition hover:bg-white/[.03] sm:grid-cols-[1.2fr_.8fr_.8fr_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-xs font-bold text-amber-300">
                  {student.studentName
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold transition group-hover:text-amber-300">
                    {student.studentName}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] text-white/32">
                    {student.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold">
                  {student.uploaded} uploaded
                </p>
                <p className="mt-0.5 text-[10px] text-white/32">
                  {student.verified} verified
                </p>
              </div>
              <span
                className={cn(
                  'w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                  student.pending
                    ? 'border-amber-400/25 bg-amber-400/[.08] text-amber-300'
                    : student.needsAction
                      ? 'border-rose-400/25 bg-rose-400/[.08] text-rose-300'
                      : 'border-emerald-400/25 bg-emerald-400/[.08] text-emerald-300',
                )}
              >
                {student.pending
                  ? `${student.pending} awaiting review`
                  : student.needsAction
                    ? `${student.needsAction} need replacement`
                    : 'Verification complete'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-white/35 transition group-hover:text-amber-300">
                Open profile <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
          {!documentReviews.length && (
            <div className="py-14 text-center">
              <FileCheck2 className="mx-auto size-7 text-white/25" />
              <p className="mt-3 text-sm font-semibold">
                No documents uploaded yet
              </p>
              <p className="mt-1 text-xs text-white/35">
                Students will appear here after their first upload.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_.75fr]">
        <div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Priority queue
              </p>
              <h3 className="mt-1 font-display text-xl">
                Cases needing attention
              </h3>
            </div>
            <Link
              href="/staff/students"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-300"
            >
              View pipeline <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.055] px-3 pb-3 sm:px-4">
            {priority.map((item) => (
              <Link
                key={item.id}
                href="/staff/students"
                className="group grid gap-3 rounded-xl px-3 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[1.1fr_1.2fr_.8fr_auto] sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-400/10 text-xs font-bold text-indigo-200">
                    {item.studentName
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {item.studentName}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-white/32">
                      {item.program}
                    </p>
                  </div>
                </div>
                <p className="truncate text-xs text-white/55">
                  {item.university}
                </p>
                <span className="w-fit rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-sky-300">
                  {statusLabel(item.status)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[10px] text-white/35">
                    {item.progress}%
                  </span>
                </div>
              </Link>
            ))}
            {!priority.length && (
              <div className="py-14 text-center">
                <CheckCircle2 className="mx-auto size-7 text-emerald-300" />
                <p className="mt-3 text-sm font-semibold">The queue is clear</p>
                <p className="mt-1 text-xs text-white/35">
                  New student cases will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Pipeline health
              </p>
            </div>
            <div className="mt-6 space-y-5">
              {[
                [
                  'Applications moving',
                  queue.filter((i) => i.progress >= 50).length,
                  queue.length,
                ],
                ['Offers secured', offers, queue.length],
                ['Visa active', visaActive, queue.length],
              ].map(([label, value, total]) => {
                const pct = Number(total)
                  ? Math.round((Number(value) / Number(total)) * 100)
                  : 0
                return (
                  <div key={String(label)}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-white/48">{label}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="staff-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6">
            <Clock3 className="size-5 text-amber-300" />
            <h3 className="mt-4 font-display text-xl">Daily focus</h3>
            <p className="mt-2 text-xs leading-6 text-white/38">
              Review the lowest-progress cases first, then follow up on
              applications waiting for student documents.
            </p>
            <Link
              href="/staff/students"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a]"
            >
              Start reviewing <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
      {selectedApproval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedApproval(null)
          }}
        >
          <div className="staff-card flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1122]">
            <header className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.2em] text-amber-300">
                  {selectedApproval.workflowType==='VISA'?'Visa verification':'SOP verification'}
                </p>
                <h3 className="mt-1 font-display text-2xl">
                  {selectedApproval.studentName}
                </h3>
                <p className="mt-1 text-xs text-white/40">
                  {selectedApproval.program} · {selectedApproval.universityName}
                </p>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="grid size-9 place-items-center rounded-full border border-white/10 text-white/50 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_300px]">
              <div className="min-h-[55vh] bg-slate-950/40 p-3">
                {selectedApproval.fileId &&
                selectedApproval.mimeType === 'application/pdf' ? (
                  <iframe
                    title="SOP preview"
                    src={`/api/workflow?workflowFileId=${encodeURIComponent(selectedApproval.fileId)}&preview=1`}
                    className="h-full min-h-[55vh] w-full rounded-xl bg-white"
                  />
                ) : (
                  <div className="grid h-full min-h-[55vh] place-items-center rounded-xl border border-dashed border-white/10 text-center">
                    <div>
                      <FileText className="mx-auto size-10 text-white/25" />
                      <p className="mt-3 text-sm font-semibold">
                      {selectedApproval.workflowType==='VISA'?statusLabel(selectedApproval.stage):'Preview is unavailable for this file type'}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                      {selectedApproval.workflowType==='VISA'?'Review the visa case details and record your decision.':'Download the document to review it.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <aside className="border-l border-white/10 p-5">
                <p className="text-xs font-semibold">
                  {selectedApproval.workflowType==='VISA'?statusLabel(selectedApproval.stage):(selectedApproval.fileName || 'SOP file unavailable')}
                </p>
                {selectedApproval.fileId && (
                  <a
                    href={`/api/workflow?workflowFileId=${encodeURIComponent(selectedApproval.fileId)}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-300/25 py-3 text-[10px] font-bold text-amber-300"
                  >
                    <Download className="size-3.5" />
                    Download SOP
                  </a>
                )}
                <label className="mt-6 block text-[9px] font-semibold uppercase tracking-[.15em] text-white/40">
                  Review note
                  <textarea
                    value={reviewNotes[selectedApproval.id] || ''}
                    onChange={(event) =>
                      setReviewNotes((current) => ({
                        ...current,
                        [selectedApproval.id]: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Required when requesting corrections"
                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[.035] p-3 text-xs normal-case tracking-normal outline-none focus:border-amber-300/30"
                  />
                </label>
                {decideSop.error && (
                  <p className="mt-3 text-xs text-rose-300">
                    {decideSop.error.message}
                  </p>
                )}
                <div className="mt-5 grid gap-2">
                  <button
                    disabled={decideSop.isPending || (selectedApproval.workflowType==='APPLICATION' && !selectedApproval.fileId)}
                    onClick={() =>
                      decideSop.mutate({
                        applicationId: selectedApproval.applicationId,
                        workflowType: selectedApproval.workflowType,
                        visaAttemptId: selectedApproval.visaAttemptId,
                        targetStage: selectedApproval.workflowType==='APPLICATION'?'SOP_APPROVED':selectedApproval.stage,
                        approvalStage: selectedApproval.workflowType==='VISA'?selectedApproval.stage:undefined,
                        approvalRequestId: selectedApproval.id,
                        note:
                          reviewNotes[selectedApproval.id] ||
                          `${statusLabel(selectedApproval.stage)} approved.`,
                      })
                    }
                    className="rounded-xl bg-emerald-400 py-3 text-[10px] font-bold text-slate-950 disabled:opacity-40"
                  >
                    Approve {selectedApproval.workflowType==='VISA'?'verification':'SOP'}
                  </button>
                  <button
                    disabled={
                      decideSop.isPending ||
                      !reviewNotes[selectedApproval.id]?.trim()
                    }
                    onClick={() =>
                      decideSop.mutate({
                        applicationId: selectedApproval.applicationId,
                        workflowType: selectedApproval.workflowType,
                        visaAttemptId: selectedApproval.visaAttemptId,
                        targetStage: selectedApproval.workflowType==='APPLICATION'?'SOP_CORRECTION_REQUIRED':selectedApproval.currentStage,
                        outcome: selectedApproval.workflowType==='VISA'?'REJECTED':undefined,
                        approvalStage: selectedApproval.workflowType==='VISA'?selectedApproval.stage:undefined,
                        approvalRequestId: selectedApproval.id,
                        note: reviewNotes[selectedApproval.id],
                      })
                    }
                    className="rounded-xl border border-rose-300/30 bg-rose-400/10 py-3 text-[10px] font-bold text-rose-300 disabled:opacity-40"
                  >
                    Request corrections
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
