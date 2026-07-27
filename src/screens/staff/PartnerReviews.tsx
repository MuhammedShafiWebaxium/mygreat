'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Building2, CheckCircle2, Clock3, Mail, MapPin, XCircle } from 'lucide-react'
import { partnerApplicationsQuery } from '@/features/admin/admin.queries'
import { reviewPartnerFn } from '@/features/admin/admin.functions'
import { cn } from '@/lib/utils'
import { currentUserQuery } from '@/features/auth/auth.queries'

export default function PartnerReviews() {
  const queryClient = useQueryClient()
  const { data: partners } = useSuspenseQuery(partnerApplicationsQuery)
  const { data: user } = useSuspenseQuery(currentUserQuery)
  const [note, setNote] = useState<Record<string, string>>({})
  const review = useMutation({
    mutationFn: (data: { partnerCompanyId: string; decision: 'APPROVE' | 'REJECT'; note?: string }) =>
      reviewPartnerFn({ data }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['staff', 'partners'] }),
  })

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6">
        <Building2 className="size-6 text-amber-300" />
        <h2 className="mt-3 font-display text-2xl">Partner applications</h2>
        <p className="mt-2 text-xs text-white/40">Review partner details before issuing a Partner Admin account.</p>
      </section>
      {review.error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">{review.error instanceof Error ? review.error.message : 'Review failed.'}</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {partners.map((partner) => (
          <article key={partner.id} className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-400/10"><Building2 className="size-5 text-indigo-300" /></span>
              <div className="min-w-0 flex-1"><Link href={`/staff/partners/${partner.id}`} className="font-semibold transition hover:text-amber-300">{partner.name}</Link><p className="mt-1 text-xs text-white/35">Registration: {partner.registrationNumber}</p></div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', partner.status === 'PENDING' ? 'bg-amber-300/10 text-amber-300' : partner.status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300')}>{partner.status}</span>
            </div>
            <div className="mt-5 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
              <p className="flex gap-2"><Mail className="size-3.5" />{partner.contactName} · {partner.contactEmail}</p>
              <p className="flex gap-2"><MapPin className="size-3.5" />{partner.country}</p>
              <p className="flex gap-2"><Clock3 className="size-3.5" />{new Date(partner.createdAt).toLocaleDateString()}</p>
              <p>{partner._count.partners} partner accounts</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/40">{partner.address}</p>
            {partner.status === 'PENDING' && user?.role === 'SUPER_ADMIN' && (
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <textarea value={note[partner.id] ?? ''} onChange={(event) => setNote({ ...note, [partner.id]: event.target.value })} placeholder="Review note (optional)" className="min-h-20 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs outline-none" />
                <div className="mt-3 flex gap-3">
                  <button disabled={review.isPending} onClick={() => review.mutate({ partnerCompanyId: partner.id, decision: 'REJECT', note: note[partner.id] })} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/20 py-3 text-xs font-bold text-rose-300"><XCircle className="size-4" />Reject</button>
                  <button disabled={review.isPending} onClick={() => review.mutate({ partnerCompanyId: partner.id, decision: 'APPROVE', note: note[partner.id] })} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950"><CheckCircle2 className="size-4" />Approve</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
