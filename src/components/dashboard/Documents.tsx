import { motion } from 'framer-motion'
import { Check, Clock, Upload, FileText, ShieldCheck } from 'lucide-react'
import { DOCUMENTS, type DocItem } from '@/data/dashboard'
import { Panel, PanelTitle, Bar, fadeUp } from './bits'
import { cn } from '@/lib/utils'

const META = {
  verified: { label: 'Verified', cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25', icon: Check, iconCls: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' },
  pending: { label: 'In review', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/25', icon: Clock, iconCls: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
  needed: { label: 'Upload needed', cls: 'text-white/50 bg-white/[0.05] border-white/15', icon: Upload, iconCls: 'bg-white/[0.05] text-white/40 border-white/15 border-dashed' },
}

export default function Documents({ documents = DOCUMENTS }: { documents?: DocItem[] }) {
  const verified = documents.filter((d) => d.status === 'verified').length
  const pct = documents.length ? Math.round((verified / documents.length) * 100) : 0

  return (
    <div className="space-y-5 max-w-5xl">
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
        <h2 className="font-display text-2xl sm:text-3xl font-light">
          Document <span className="text-gradient-gold font-medium">center</span>
        </h2>
        <p className="text-white/45 text-sm mt-1.5">One vault, shared across all your applications — UKVI compliant.</p>
      </motion.div>

      {/* summary */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
        <Panel className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px]">{verified} of {documents.length} verified</p>
              <Bar value={pct} className="mt-2.5 max-w-md" />
            </div>
            <span className="font-display text-2xl text-gradient-gold font-medium">{pct}%</span>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold bg-gradient-to-r from-amber-300 to-amber-500 text-[#0a0f24] shadow-[0_8px_30px_-8px_rgba(242,179,61,0.5)] hover:-translate-y-0.5 transition-all shrink-0">
            <Upload className="w-4 h-4" strokeWidth={2.4} /> Upload document
          </button>
        </Panel>
      </motion.div>

      {/* grid */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
        <Panel>
          <PanelTitle>All documents</PanelTitle>
          <div className="grid sm:grid-cols-2 gap-3 px-4 sm:px-5 pb-5">
            {documents.map((d) => {
              const m = META[d.status]
              return (
                <div
                  key={d.id}
                  className={cn(
                    'rounded-2xl p-4 border transition-all flex items-center gap-3.5',
                    d.status === 'needed'
                      ? 'border-dashed border-white/15 bg-transparent hover:border-amber-400/40 cursor-pointer'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', m.iconCls)}>
                    {d.status === 'needed' ? <Upload className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13.5px] truncate">{d.name}</p>
                    <p className="text-[11px] text-white/35 mt-0.5 truncate">{d.note}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 text-[10.5px] font-semibold rounded-full px-2.5 py-1 border shrink-0', m.cls)}>
                    <m.icon className="w-3 h-3" strokeWidth={3} />
                    {m.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}

