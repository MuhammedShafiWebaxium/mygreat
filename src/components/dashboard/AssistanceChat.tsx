import { useEffect, useState } from 'react'
import { Crown, Send, X } from 'lucide-react'
import { getStudentSupport, sendStudentSupportMessage } from '@/features/support/support.functions'

export default function AssistanceChat({ close }: { close: () => void }) {
  const [state, setState] = useState<any>()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => getStudentSupport().then(setState)

  useEffect(() => {
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [])

  const send = async () => {
    if (!draft.trim()) return
    setBusy(true)
    try {
      await sendStudentSupportMessage(draft)
      setDraft('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  return <section className="assistance-chat fixed bottom-5 right-5 z-[80] flex h-[min(620px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1122] text-white shadow-2xl">
    <header className="assistance-chat-header flex items-center border-b border-white/[.08] bg-gradient-to-r from-amber-400/[.12] to-transparent p-4">
      <div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold">Mygreat Support</p>{state?.subscription?.status === 'ACTIVE' && <Crown className="size-3.5 text-amber-500" />}</div><p className="assistance-chat-muted mt-0.5 text-[10px] text-white/40">We’re here to help with your journey.</p></div>
      <button onClick={close} aria-label="Close support chat" className="assistance-chat-close grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/[.08] hover:text-white"><X className="size-4" /></button>
    </header>
    <div className="assistance-chat-body flex-1 space-y-3 overflow-y-auto p-4">
      {state?.messages?.map((message: any) => <div key={message.id} className={`flex ${message.senderType === 'STUDENT' ? 'justify-end' : ''}`}><div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.senderType === 'STUDENT' ? 'assistance-chat-student bg-amber-400 text-slate-950' : 'assistance-chat-support bg-white/[.07]'}`}>{message.body}</div></div>)}
      {state && !state.messages.length && <p className="assistance-chat-empty py-20 text-center text-xs text-white/35">Hi! What can we help you with today?</p>}
    </div>
    <div className="assistance-chat-composer flex gap-2 border-t border-white/[.08] p-3">
      <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Type your message…" className="assistance-chat-input flex-1 rounded-xl border border-white/10 bg-white/[.05] px-3 text-xs outline-none transition focus:border-amber-400/60" />
      <button disabled={busy || !draft.trim()} onClick={send} aria-label="Send message" className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-4" /></button>
    </div>
  </section>
}
