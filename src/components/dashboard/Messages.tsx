import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Phone, Video } from 'lucide-react'
import { CONVERSATIONS, type ChatMessage } from '@/data/dashboard'
import { Panel, Avatar, fadeUp } from './bits'
import { cn } from '@/lib/utils'

interface Props {
  onRead: () => void
}

export default function Messages({ onRead }: Props) {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id)
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(
    Object.fromEntries(CONVERSATIONS.map((c) => [c.id, c.messages]))
  )
  const [draft, setDraft] = useState('')

  const active = CONVERSATIONS.find((c) => c.id === activeId)!
  const messages = threads[activeId]

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const msg: ChatMessage = {
      id: `u${Date.now()}`,
      from: 'me',
      text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }
    setThreads((t) => ({ ...t, [activeId]: [...t[activeId], msg] }))
    setDraft('')
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="max-w-5xl">
      <h2 className="font-display text-2xl sm:text-3xl font-light">
        <span className="text-gradient-gold font-medium">Messages</span>
      </h2>
      <p className="text-white/45 text-sm mt-1.5">Your counsellor and the Mygreat team, one thread away.</p>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 mt-6 items-start">
        {/* conversation list */}
        <Panel className="p-2.5 space-y-1">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id)
                if (c.id === 'priya') onRead()
              }}
              className={cn(
                'w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all',
                activeId === c.id ? 'bg-amber-400/[0.08] border border-amber-400/25' : 'hover:bg-white/[0.03] border border-transparent'
              )}
            >
              <Avatar initials={c.initials} className="w-10 h-10 text-xs shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold truncate">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-amber-400 text-[#0a0f24] text-[9.5px] font-bold flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-white/40 truncate mt-0.5">{c.preview}</p>
              </div>
            </button>
          ))}
        </Panel>

        {/* chat */}
        <Panel className="flex flex-col h-[520px]">
          {/* chat header */}
          <div className="flex items-center gap-3.5 px-5 py-4 border-b border-white/[0.07]">
            <Avatar initials={active.initials} className="w-10 h-10 text-xs" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px]">{active.name}</p>
              <p className="text-[11px] text-emerald-300/90 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online · {active.role}
              </p>
            </div>
            <button className="w-9 h-9 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 flex items-center justify-center transition-all">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/25 flex items-center justify-center transition-all">
              <Video className="w-4 h-4" />
            </button>
          </div>

          {/* bubbles */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-3.5">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
                    m.from === 'me'
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-[#0a0f24] rounded-br-md font-medium'
                      : 'bg-white/[0.05] border border-white/[0.08] text-white/85 rounded-bl-md'
                  )}
                >
                  <p>{m.text}</p>
                  <p className={cn('text-[10px] mt-1.5', m.from === 'me' ? 'text-[#0a0f24]/60' : 'text-white/30')}>{m.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* composer */}
          <div className="px-4 py-3.5 border-t border-white/[0.07] flex items-center gap-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${active.name.split(' ')[0]}…`}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-[13px] placeholder:text-white/30 outline-none focus:border-amber-400/50 transition-colors"
            />
            <button
              onClick={send}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#0a0f24] flex items-center justify-center shadow-[0_6px_24px_-6px_rgba(242,179,61,0.55)] hover:-translate-y-0.5 transition-all shrink-0"
            >
              <Send className="w-4 h-4" strokeWidth={2.4} />
            </button>
          </div>
        </Panel>
      </div>
    </motion.div>
  )
}

