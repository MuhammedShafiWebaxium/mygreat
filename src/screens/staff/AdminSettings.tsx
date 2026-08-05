import { useEffect, useState } from 'react'
import { Bell, History, Save, Settings2, RefreshCw, CircleDollarSign, ExternalLink, FileText, Plus, Trash2 } from 'lucide-react'
import { getFinance, savePriorityPrice } from '@/features/support/support.functions'
import { deleteRequiredDocumentSettingFn, getExchangeRateSettingsFn, getRequiredDocumentSettingsFn, refreshExchangeRatesFn, saveRequiredDocumentSettingFn, type ExchangeRateSettings, type RequiredDocumentSetting } from '@/features/admin/admin.functions'
import { cn } from '@/lib/utils'

type SettingsTab = 'subscription' | 'required-documents' | 'exchange-rates' | 'general' | 'notifications'

export default function AdminSettings() {
  const [data, setData] = useState<any>()
  const [price, setPrice] = useState('999')
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('subscription')
  const [rates,setRates]=useState<ExchangeRateSettings>()
  const [ratesLoading,setRatesLoading]=useState(false)
  const [ratesError,setRatesError]=useState('')
  const [requiredDocuments,setRequiredDocuments]=useState<RequiredDocumentSetting[]>([])
  const [documentsSaving,setDocumentsSaving]=useState(false)
  const load = () => getFinance().then((value: any) => {
    setData(value)
    setPrice(String((value.plans[0]?.priceMinor ?? 99900) / 100))
  })

  useEffect(() => { load();getExchangeRateSettingsFn().then(setRates).catch(()=>{});getRequiredDocumentSettingsFn().then(setRequiredDocuments).catch(()=>{}) }, [])
  if (!data) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.03]" />

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings2 }[] = [
    { id: 'subscription', label: 'Subscription', icon: Settings2 },
    { id: 'required-documents', label: 'Required documents', icon: FileText },
    { id: 'exchange-rates', label: 'Exchange rates', icon: CircleDollarSign },
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
    {tab === 'exchange-rates' && <section className="staff-card rounded-3xl border border-white/[.07] p-6">
      <div className="flex flex-wrap items-start gap-4"><div className="flex-1"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">INR fee conversion</p><h3 className="mt-2 font-display text-2xl">Central-bank exchange rates</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">Refresh once per business day. Frankfurter aggregates published rates from 84 central banks, covering currencies such as AED and MUR that are absent from the ECB-only feed.</p><a href={rates?.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:underline">Frankfurter provider documentation <ExternalLink className="size-3"/></a></div><button disabled={ratesLoading} onClick={async()=>{setRatesLoading(true);setRatesError('');try{setRates(await refreshExchangeRatesFn())}catch(error){setRatesError(error instanceof Error?error.message:'Refresh failed.')}finally{setRatesLoading(false)}}} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 disabled:opacity-60"><RefreshCw className={cn('size-4',ratesLoading&&'animate-spin')}/>{ratesLoading?'Refreshing…':'Refresh rates now'}</button></div>
      {ratesError&&<p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{ratesError}</p>}
      {rates&&<><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[.07] p-4"><p className="text-[10px] text-white/35">Provider date</p><p className="mt-2 text-sm font-semibold">{rates.rates[0]?new Date(rates.rates[0].providerDate).toLocaleDateString():'Not refreshed'}</p></div><div className="rounded-2xl border border-white/[.07] p-4"><p className="text-[10px] text-white/35">Currencies</p><p className="mt-2 text-sm font-semibold">{rates.rates.length}</p></div><div className="rounded-2xl border border-white/[.07] p-4"><p className="text-[10px] text-white/35">Fee coverage</p><p className="mt-2 text-sm font-semibold">{rates.coverage.converted} of {rates.coverage.total}</p></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-white/[.07]"><div className="grid grid-cols-3 bg-white/[.035] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/35"><span>Currency</span><span>INR for 1 unit</span><span>Updated</span></div>{rates.rates.map(rate=><div key={rate.currencyCode} className="grid grid-cols-3 border-t border-white/[.06] px-4 py-3 text-xs"><strong>{rate.currencyCode}</strong><span>₹{rate.rateToInr.toLocaleString('en-IN',{maximumFractionDigits:4})}</span><span className="text-white/40">{new Date(rate.updatedAt).toLocaleString()}</span></div>)}</div></>}
    </section>}
    {tab === 'required-documents' && <section className="staff-card rounded-3xl border border-white/[.07] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">Application prerequisites</p><h3 className="mt-2 font-display text-2xl">Required documents</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">Manage the documents every student must upload and have verified before an application can be created.</p></div><button onClick={()=>setRequiredDocuments(current=>[...current,{id:`document-${Date.now()}`,name:'',accept:'.pdf,.jpg,.jpeg,.png',active:true,sortOrder:(current.at(-1)?.sortOrder??0)+10}])} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-slate-950"><Plus className="size-4"/>Add document</button></div>
      <div className="mt-6 space-y-3">{requiredDocuments.map((document,index)=><div key={document.id} className="grid gap-3 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 md:grid-cols-[1.2fr_1fr_90px_auto_auto] md:items-end"><label className="text-[10px] text-white/40">Document name<input value={document.name} onChange={e=>setRequiredDocuments(current=>current.map((item,i)=>i===index?{...item,name:e.target.value}:item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/40"/></label><label className="text-[10px] text-white/40">Accepted file types<input value={document.accept} onChange={e=>setRequiredDocuments(current=>current.map((item,i)=>i===index?{...item,accept:e.target.value}:item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/40"/></label><label className="text-[10px] text-white/40">Order<input type="number" min="0" value={document.sortOrder} onChange={e=>setRequiredDocuments(current=>current.map((item,i)=>i===index?{...item,sortOrder:Number(e.target.value)}:item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none"/></label><label className="flex h-10 items-center gap-2 text-xs"><input type="checkbox" checked={document.active} onChange={e=>setRequiredDocuments(current=>current.map((item,i)=>i===index?{...item,active:e.target.checked}:item))}/>Required</label><button title="Delete document" onClick={async()=>{if(document.name&&confirm(`Delete ${document.name}?`))await deleteRequiredDocumentSettingFn(document.id);setRequiredDocuments(current=>current.filter((_,i)=>i!==index))}} className="grid size-10 place-items-center rounded-xl border border-rose-400/20 text-rose-300 hover:bg-rose-400/10"><Trash2 className="size-4"/></button></div>)}</div>
      <button disabled={documentsSaving||requiredDocuments.some(item=>!item.name.trim())} onClick={async()=>{setDocumentsSaving(true);try{await Promise.all(requiredDocuments.map(saveRequiredDocumentSettingFn));setRequiredDocuments(await getRequiredDocumentSettingsFn())}finally{setDocumentsSaving(false)}}} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 disabled:opacity-50"><Save className="size-4"/>{documentsSaving?'Saving…':'Save requirements'}</button>
    </section>}
    {tab === 'general' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">General settings</h3><p className="mt-2 text-xs text-white/35">Platform identity, regional preferences, and support configuration will be managed here.</p></section>}
    {tab === 'notifications' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">Notification settings</h3><p className="mt-2 text-xs text-white/35">Notification delivery preferences will appear here as channels are enabled.</p></section>}
  </div>
}
