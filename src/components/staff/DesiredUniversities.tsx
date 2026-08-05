'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, FilePlus2, GraduationCap, Upload, X } from 'lucide-react'
import { staffCreateApplicationFn } from '@/features/workflow/workflow.functions'
import { useRouter } from '@/lib/navigation'

type DesiredUniversity = { id: string; name: string; city: string; rank: number }

export function DesiredUniversities({ studentId, universities, appliedUniversityIds, pendingUniversityIds, selectedCourse }: {
  studentId: string
  universities: DesiredUniversity[]
  appliedUniversityIds: string[]
  pendingUniversityIds: string[]
  selectedCourse: string
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<DesiredUniversity | null>(null)
  const [sopFile,setSopFile]=useState<File|null>(null)
  const create = useMutation({
    mutationFn: () => {if(!selected||!sopFile)throw new Error('Attach the student SOP.');return staffCreateApplicationFn({ data: { studentId, universityId: selected.id, program: selectedCourse },file:sopFile })},
    onSuccess: () => { setSelected(null);setSopFile(null); router.refresh() },
  })

  return <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6">
    <div className="flex items-center gap-2"><GraduationCap className="size-4 text-sky-300"/><h3 className="font-display text-xl">Desired universities</h3></div>
    <p className="mt-2 text-xs text-white/35">Universities selected by the student during onboarding.</p>
    {!selectedCourse&&<p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[.07] p-3 text-[11px] text-amber-200">The student must select a course before an application can be created.</p>}
    <div className="mt-4 space-y-2">{universities.map(university=>{
      const hasApplication=appliedUniversityIds.includes(university.id)
      const pending=pendingUniversityIds.includes(university.id)
      return <div key={university.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{university.name}</p><p className="mt-1 text-[10px] text-white/35">{university.city} · Rank #{university.rank}</p></div>{hasApplication?<span className={pending?'inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2.5 py-1 text-[9px] font-semibold text-amber-600':'inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-2.5 py-1 text-[9px] font-semibold text-emerald-600'}><CheckCircle2 className="size-3"/>{pending?'SOP verification pending':'Application exists'}</span>:<button disabled={!selectedCourse} onClick={()=>setSelected(university)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-[10px] font-bold text-[#10172a] disabled:cursor-not-allowed disabled:opacity-40"><FilePlus2 className="size-3.5"/>Create application</button>}</div></div>
    })}{!universities.length&&<p className="text-xs text-white/35">The student has not selected any universities.</p>}</div>

    {selected&&<div className="fixed inset-0 z-[80] overflow-hidden"><button aria-label="Close application form" onClick={()=>setSelected(null)} className="absolute inset-0 bg-black/55 backdrop-blur-sm"/><aside className="staff-application-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0b1020] shadow-2xl"><header className="flex items-start gap-3 border-b border-white/[.08] p-6"><span className="grid size-10 place-items-center rounded-xl bg-amber-400/10"><FilePlus2 className="size-5 text-amber-300"/></span><div className="min-w-0 flex-1"><h2 className="font-display text-2xl">Create application</h2><p className="mt-1 text-xs text-white/40">Confirm the student's university and selected course.</p></div><button onClick={()=>setSelected(null)} className="grid size-9 place-items-center rounded-xl border border-white/10"><X className="size-4"/></button></header>
      <form onSubmit={event=>{event.preventDefault();create.mutate()}} className="flex flex-1 flex-col overflow-y-auto p-6"><div><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">University</span><div className="rounded-xl border border-white/[.08] bg-white/[.035] p-4"><p className="text-sm font-semibold">{selected.name}</p><p className="mt-1 text-xs text-white/35">{selected.city}</p></div></div><div className="mt-5"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Student's selected course</span><div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[.07] p-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><BookOpen className="size-4"/></span><div><p className="text-sm font-semibold text-amber-100">{selectedCourse}</p><p className="mt-1 text-[10.5px] text-white/38">Selected during onboarding step 2.</p></div></div></div><div className="mt-5"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Statement of purpose · Required</span><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-amber-300/30 bg-amber-300/[.04] p-4 text-xs"><Upload className="size-4 text-amber-300"/><span className="min-w-0 flex-1 truncate">{sopFile?.name||'Choose SOP (PDF, DOC, or DOCX)'}</span><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={event=>setSopFile(event.target.files?.[0]||null)}/></label><p className="mt-2 text-[10px] leading-4 text-white/35">The application stays hidden until Super Admin verifies this SOP.</p></div>{create.error&&<p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{create.error.message}</p>}<div className="mt-auto flex gap-3 border-t border-white/[.08] pt-5"><button type="button" onClick={()=>{setSelected(null);setSopFile(null)}} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/60">Cancel</button><button disabled={selectedCourse.trim().length<2||!sopFile||create.isPending} className="flex-[1.4] rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#10172a] disabled:opacity-40">{create.isPending?'Submitting…':'Submit for SOP verification'}</button></div></form>
    </aside></div>}
  </div>
}
