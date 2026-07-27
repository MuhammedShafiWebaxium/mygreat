'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, FilePlus2, GraduationCap, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { staffCreateApplicationFn } from '@/features/workflow/workflow.functions'

type DesiredUniversity = {
  id: string
  name: string
  city: string
  rank: number
}

export function DesiredUniversities({
  studentId,
  universities,
  appliedUniversityIds,
}: {
  studentId: string
  universities: DesiredUniversity[]
  appliedUniversityIds: string[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<DesiredUniversity | null>(null)
  const [program, setProgram] = useState('')
  const create = useMutation({
    mutationFn: () => staffCreateApplicationFn({
      data: { studentId, universityId: selected?.id, program },
    }),
    onSuccess: () => {
      setSelected(null)
      setProgram('')
      router.refresh()
    },
  })

  return <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6">
    <div className="flex items-center gap-2"><GraduationCap className="size-4 text-sky-300" /><h3 className="font-display text-xl">Desired universities</h3></div>
    <p className="mt-2 text-xs text-white/35">Universities selected by the student during onboarding.</p>
    <div className="mt-4 space-y-2">{universities.map((university) => {
      const hasApplication = appliedUniversityIds.includes(university.id)
      return <div key={university.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
        <div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{university.name}</p><p className="mt-1 text-[10px] text-white/35">{university.city} · Rank #{university.rank}</p></div>
          {hasApplication ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-2.5 py-1 text-[9px] font-semibold text-emerald-300"><CheckCircle2 className="size-3" />Application exists</span> : <button onClick={() => { setSelected(university); setProgram('') }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-[10px] font-bold text-[#10172a]"><FilePlus2 className="size-3.5" />Create application</button>}
        </div>
      </div>
    })}{!universities.length && <p className="text-xs text-white/35">The student has not selected any universities.</p>}</div>

    {selected && <div className="fixed inset-0 z-[80] overflow-hidden"><button aria-label="Close application form" onClick={() => setSelected(null)} className="absolute inset-0 bg-black/55 backdrop-blur-sm" /><aside className="staff-application-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1020] shadow-2xl"><header className="flex items-start gap-3 border-b border-white/[.08] p-6"><span className="grid size-10 place-items-center rounded-xl bg-amber-400/10"><FilePlus2 className="size-5 text-amber-300" /></span><div className="min-w-0 flex-1"><h2 className="font-display text-2xl">Create application</h2><p className="mt-1 text-xs text-white/40">{selected.name}</p></div><button onClick={() => setSelected(null)} className="grid size-9 place-items-center rounded-xl border border-white/10"><X className="size-4" /></button></header>
      <form onSubmit={(event) => { event.preventDefault(); create.mutate() }} className="flex flex-1 flex-col overflow-y-auto p-6"><div><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">University</span><div className="rounded-xl border border-white/[.08] bg-white/[.035] p-4"><p className="text-sm font-semibold">{selected.name}</p><p className="mt-1 text-xs text-white/35">{selected.city}</p></div></div><label className="mt-5 block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Program</span><input autoFocus required minLength={2} value={program} onChange={(event) => setProgram(event.target.value)} placeholder="e.g. MSc Data Science" className="w-full rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm outline-none" /></label>{create.error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{create.error.message}</p>}<div className="mt-auto flex gap-3 border-t border-white/[.08] pt-5"><button type="button" onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/60">Cancel</button><button disabled={program.trim().length < 2 || create.isPending} className="flex-[1.4] rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a] disabled:opacity-40">{create.isPending ? 'Creating…' : 'Create application'}</button></div></form>
    </aside></div>}
  </div>
}
