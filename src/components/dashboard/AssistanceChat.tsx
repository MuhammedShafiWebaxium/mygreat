import { useEffect, useState } from 'react'
import { Check, Crown, RotateCcw, Send, X } from 'lucide-react'
import { decideStudentTicketResolution, getStudentSupport, sendStudentSupportMessage } from '@/features/support/support.functions'

export default function AssistanceChat({ close }: { close: () => void }) {
  const [state, setState] = useState<any>()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = () => getStudentSupport().then(setState)

  useEffect(() => {
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [])

  const send = async () => {
    if (!draft.trim()) return
    setBusy(true)
    setError('')
    try {
      await sendStudentSupportMessage(draft)
      setDraft('')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send your message.')
    } finally {
      setBusy(false)
    }
  }

  const decideResolution = async (decision: 'APPROVE' | 'REJECT') => {
    if (!state?.thread?.id) return
    setBusy(true)
    setError('')
    try {
      await decideStudentTicketResolution(state.thread.id, decision)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the ticket.')
    } finally {
      setBusy(false)
    }
  }

  const statusLabel = state?.thread?.status?.toLowerCase().replaceAll('_', ' ').replace(/^./, (value: string) => value.toUpperCase())

  return <section className="assistance-chat fixed bottom-5 right-5 z-[80] flex h-[min(620px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1122] text-white shadow-2xl">
    <header className="assistance-chat-header flex items-center border-b border-white/[.08] bg-gradient-to-r from-amber-400/[.12] to-transparent p-4">
      <div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold">Mygreat Support</p>{state?.subscription?.status === 'ACTIVE' && <Crown className="size-3.5 text-amber-500" />}</div>{state?.thread?<p className="assistance-chat-muted mt-0.5 flex items-center gap-2 text-[10px] text-white/45"><span>Ticket #{state.thread.ticketNumber}</span><span>·</span><span className="font-semibold">{statusLabel}</span></p>:<p className="assistance-chat-muted mt-0.5 text-[10px] text-white/40">We’re here to help with your journey.</p>}</div>
      <button onClick={close} aria-label="Close support chat" className="assistance-chat-close grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/[.08] hover:text-white"><X className="size-4" /></button>
    </header>
    <div className="assistance-chat-body flex-1 space-y-3 overflow-y-auto p-4">
      {error&&<div className="assistance-chat-error rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-[10px] text-rose-200">{error}</div>}
      {state?.messages?.map((message: any) => <div key={message.id} className={`flex ${message.senderType === 'STUDENT' ? 'justify-end' : ''}`}><div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.senderType === 'STUDENT' ? 'assistance-chat-student bg-amber-400 text-slate-950' : 'assistance-chat-support bg-white/[.07]'}`}>{message.body}</div></div>)}
      {state && !state.messages.length && <p className="assistance-chat-empty py-20 text-center text-xs text-white/35">Hi! What can we help you with today?</p>}
      {state?.thread?.status==='RESOLUTION_PENDING'&&<div className="assistance-chat-resolution-pending rounded-2xl border border-orange-400/20 bg-orange-400/[.08] p-4"><p className="text-xs font-semibold text-orange-200">Does this resolve your ticket?</p><p className="mt-1 text-[10px] leading-4 text-white/45">Approve to resolve it, or reject to return it to the support team. It resolves automatically {state.thread.resolutionDueAt?new Date(state.thread.resolutionDueAt).toLocaleString():'after 48 hours'}.</p><div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>decideResolution('REJECT')} className="flex items-center gap-1.5 rounded-lg border border-rose-400/25 px-3 py-2 text-[10px] font-bold text-rose-300"><RotateCcw className="size-3"/>Not resolved</button><button disabled={busy} onClick={()=>decideResolution('APPROVE')} className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-[10px] font-bold text-emerald-950"><Check className="size-3"/>Approve</button></div></div>}
      {state?.thread?.status==='RESOLVED'&&<div className="assistance-chat-resolved rounded-2xl border border-emerald-400/20 bg-emerald-400/[.08] p-4 text-center"><p className="text-xs font-semibold text-emerald-200">Ticket #{state.thread.ticketNumber} is resolved</p><p className="mt-1 text-[10px] text-white/45">Send a new message below to open a fresh support ticket.</p></div>}
    </div>
    <div className="assistance-chat-composer flex gap-2 border-t border-white/[.08] p-3">
      <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder={state?.thread?.status==='RESOLVED'?'Start a new ticket…':'Type your message…'} className="assistance-chat-input flex-1 rounded-xl border border-white/10 bg-white/[.05] px-3 text-xs outline-none transition focus:border-amber-400/60" />
      <button disabled={busy || !draft.trim()} onClick={send} aria-label="Send message" className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-4" /></button>
    </div>
  </section>
}
