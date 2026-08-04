import { useEffect, useState } from 'react'
import { Bell, History, Save, Settings2 } from 'lucide-react'
import { getFinance, savePriorityPrice } from '@/features/support/support.functions'
import { cn } from '@/lib/utils'

type SettingsTab = 'subscription' | 'general' | 'notifications'

export default function AdminSettings() {
  const [data, setData] = useState<any>()
  const [price, setPrice] = useState('999')
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('subscription')
  const load = () => getFinance().then((value: any) => {
    setData(value)
    setPrice(String((value.plans[0]?.priceMinor ?? 99900) / 100))
  })

  useEffect(() => { load() }, [])
  if (!data) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.03]" />

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings2 }[] = [
    { id: 'subscription', label: 'Subscription', icon: Settings2 },
    { id: 'general', label: 'General', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return <div className="max-w-4xl space-y-5">
    <div>
      <h2 className="font-display text-3xl">Settings</h2>
      <p className="mt-1 text-xs text-white/40">Manage platform-wide billing and communication preferences.</p>
    </div>
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-1.5">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition', tab === id ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10' : 'text-white/45 hover:bg-white/[.05] hover:text-white')}><Icon className="size-4" />{label}</button>)}
    </div>

    {tab === 'subscription' && <>
      <section className="staff-card rounded-3xl border border-white/[.07] p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Subscription settings</p>
        <h3 className="mt-2 font-display text-3xl">Mygreat Pro</h3>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">Set the price for new subscribers. Saving creates a new plan version, while existing students retain their subscribed price.</p>
        <div className="mt-6 flex max-w-md gap-3"><div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/[.035] px-4"><span className="text-amber-300">₹</span><input value={price} onChange={(event) => { setPrice(event.target.value); setSaved(false) }} min="1" type="number" className="w-full bg-transparent px-2 py-3.5 outline-none" /><span className="text-xs text-white/35">/month</span></div><button onClick={async () => { await savePriorityPrice(Number(price)); await load(); setSaved(true) }} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 text-xs font-bold text-slate-950"><Save className="size-4" />{saved ? 'Saved' : 'Save price'}</button></div>
      </section>
      <section className="staff-card rounded-3xl border border-white/[.07] p-6">
        <div className="flex items-center gap-2"><History className="size-4 text-indigo-300" /><h3 className="font-display text-xl">Plan version history</h3></div>
        <div className="mt-5 space-y-2">{data.plans.map((plan: any) => <div key={plan.id} className="flex items-center rounded-xl border border-white/[.07] p-4"><div className="flex-1"><p className="text-sm font-semibold">{plan.name} · Version {plan.version}</p><p className="mt-1 text-[10px] text-white/35">Created {new Date(plan.createdAt).toLocaleDateString()}</p></div><p className="font-semibold">₹{(plan.priceMinor / 100).toLocaleString('en-IN')}/month</p>{plan.active && <span className="ml-3 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">ACTIVE</span>}</div>)}</div>
      </section>
    </>}
    {tab === 'general' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">General settings</h3><p className="mt-2 text-xs text-white/35">Platform identity, regional preferences, and support configuration will be managed here.</p></section>}
    {tab === 'notifications' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">Notification settings</h3><p className="mt-2 text-xs text-white/35">Notification delivery preferences will appear here as channels are enabled.</p></section>}
  </div>
}
