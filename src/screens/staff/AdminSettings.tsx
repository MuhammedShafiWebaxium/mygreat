import { useEffect, useRef, useState } from 'react'
import { Bell, History, Save, Settings2, RefreshCw, CircleDollarSign, ExternalLink, FileText, Plus, Trash2, Sparkles, Filter, ChevronDown, Check, Globe, Search, X } from 'lucide-react'
import { getFinance, savePriorityPrice } from '@/features/support/support.functions'
import { deleteRequiredDocumentSettingFn, getExchangeRateSettingsFn, getRequiredDocumentSettingsFn, refreshExchangeRatesFn, saveRequiredDocumentSettingFn, seedDefaultCountryChecklistsFn, type ExchangeRateSettings, type RequiredDocumentSetting } from '@/features/admin/admin.functions'
import { cn } from '@/lib/utils'

type SettingsTab = 'subscription' | 'required-documents' | 'exchange-rates' | 'general' | 'notifications'

const DESTINATION_OPTIONS = [
  { code: 'GBR', flag: '🇬🇧', label: 'United Kingdom' },
  { code: 'USA', flag: '🇺🇸', label: 'United States' },
  { code: 'CAN', flag: '🇨🇦', label: 'Canada' },
  { code: 'DEU', flag: '🇩🇪', label: 'Germany' },
  { code: 'AUS', flag: '🇦🇺', label: 'Australia' },
  { code: 'IRL', flag: '🇮🇪', label: 'Ireland' },
  { code: 'NZL', flag: '🇳🇿', label: 'New Zealand' },
  { code: 'ARE', flag: '🇦🇪', label: 'UAE' },
  { code: 'SGP', flag: '🇸🇬', label: 'Singapore' },
  { code: 'FRA', flag: '🇫🇷', label: 'France' },
  { code: 'SWE', flag: '🇸🇪', label: 'Sweden' },
  { code: 'ITA', flag: '🇮🇹', label: 'Italy' },
  { code: 'ESP', flag: '🇪🇸', label: 'Spain' },
  { code: 'NLD', flag: '🇳🇱', label: 'Netherlands' },
]

function CountryMultiSelect({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (newValue: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const raw = (value || '').trim()
  const currentCodes = raw ? raw.split(',').map(c => c.trim()).filter(Boolean) : []
  const isGlobal = currentCodes.length === 0 || currentCodes.includes('GLOBAL')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  const toggleCode = (code: string) => {
    if (code === 'GLOBAL') {
      onChange(null)
      return
    }
    let next: string[]
    if (isGlobal) {
      next = [code]
    } else if (currentCodes.includes(code)) {
      next = currentCodes.filter(c => c !== code)
    } else {
      next = [...currentCodes, code]
    }
    onChange(next.length > 0 ? next.join(',') : null)
  }

  const selectAll = () => {
    const all = DESTINATION_OPTIONS.map(d => d.code).join(',')
    onChange(all)
  }

  const clearAll = () => {
    onChange(null)
  }

  const filteredOptions = DESTINATION_OPTIONS.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.code.toLowerCase().includes(search.toLowerCase())
  )

  const selectedItems = isGlobal
    ? []
    : currentCodes.map(c => DESTINATION_OPTIONS.find(d => d.code === c) || { code: c, flag: '🌐', label: c })

  return (
    <div ref={containerRef} className="relative mt-1.5 w-full">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex min-h-[42px] w-full items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-xs transition outline-none',
          open
            ? 'border-amber-500 bg-white text-slate-900 ring-2 ring-amber-500/20 dark:border-amber-400/60 dark:bg-slate-900 dark:text-white dark:ring-amber-400/20'
            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.035] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[.05]'
        )}
      >
        <div className="flex flex-wrap items-center gap-1 overflow-hidden truncate">
          {isGlobal ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
              <Globe className="size-3" /> Global (All Countries)
            </span>
          ) : selectedItems.length > 0 ? (
            selectedItems.slice(0, 2).map(item => (
              <span
                key={item.code}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:border-white/15 dark:bg-white/[.07] dark:text-white"
              >
                <span>{item.flag}</span>
                <span>{item.code}</span>
              </span>
            ))
          ) : (
            <span className="text-slate-400 dark:text-white/40">Select countries…</span>
          )}

          {!isGlobal && selectedItems.length > 2 && (
            <span className="rounded-lg border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
              +{selectedItems.length - 2}
            </span>
          )}
        </div>

        <ChevronDown className={cn('size-3.5 shrink-0 text-slate-400 dark:text-white/50 transition-transform duration-200', open && 'rotate-180 text-amber-600 dark:text-amber-300')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-3 dark:border-white/20 dark:bg-slate-900 dark:text-white space-y-2.5">
          {/* Header & Quick Action */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider text-[10px]">Destinations</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-500 hover:text-amber-600 dark:text-white/40 dark:hover:text-amber-300 text-[10px] font-semibold transition"
              >
                Clear
              </button>
              <span className="text-slate-300 dark:text-white/20">|</span>
              <button
                type="button"
                onClick={selectAll}
                className="text-amber-600 hover:underline dark:text-amber-300 text-[10px] font-semibold transition"
              >
                All ({DESTINATION_OPTIONS.length})
              </button>
              <span className="text-slate-300 dark:text-white/20">|</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-0.5 text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white transition"
                title="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/[.06] dark:text-white dark:placeholder-white/30 dark:focus:border-amber-400/60"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white">
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Country List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            <label
              className={cn(
                'flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition',
                isGlobal
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/[.07]'
              )}
            >
              <div className="flex items-center gap-2">
                <Globe className="size-3.5 text-amber-600 dark:text-amber-300" />
                <span>Global (All Countries)</span>
              </div>
              {isGlobal && <Check className="size-3.5 text-amber-600 dark:text-amber-300" />}
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={() => toggleCode('GLOBAL')}
                className="sr-only"
              />
            </label>

            <hr className="my-1 border-slate-100 dark:border-white/10" />

            {filteredOptions.map(opt => {
              const checked = !isGlobal && currentCodes.includes(opt.code)
              return (
                <label
                  key={opt.code}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-2.5 py-2 text-xs cursor-pointer transition',
                    checked
                      ? 'bg-amber-50 text-slate-900 font-medium border border-amber-200 dark:bg-amber-400/15 dark:text-white dark:border-amber-400/30'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/[.06]'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-sm">{opt.flag}</span>
                    <span className="truncate">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded dark:text-amber-400/80 dark:bg-amber-400/10 dark:border-amber-400/20 font-bold">
                      {opt.code}
                    </span>
                    {checked && <Check className="size-3.5 text-amber-600 dark:text-amber-300" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCode(opt.code)}
                    className="sr-only"
                  />
                </label>
              )
            })}

            {filteredOptions.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-white/40">No country matches "{search}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const PROGRAM_LEVEL_OPTIONS = [
  { code: 'UG', icon: '🎓', label: 'UG (Bachelor)' },
  { code: 'PG', icon: '🎓', label: 'PG (Master)' },
  { code: 'PHD', icon: '🔬', label: 'PhD' },
]

function ProgramLevelMultiSelect({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (newValue: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const raw = (value || 'ALL').trim().toUpperCase()
  const currentCodes = raw === 'ALL' || !raw ? [] : raw.split(',').map(c => c.trim()).filter(Boolean)
  const isAll = raw === 'ALL' || currentCodes.length === 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  const toggleCode = (code: string) => {
    if (code === 'ALL') {
      onChange('ALL')
      return
    }
    let next: string[]
    if (isAll) {
      next = [code]
    } else if (currentCodes.includes(code)) {
      next = currentCodes.filter(c => c !== code)
    } else {
      next = [...currentCodes, code]
    }
    onChange(next.length > 0 ? next.join(',') : 'ALL')
  }

  const selectedItems = isAll
    ? []
    : currentCodes.map(c => PROGRAM_LEVEL_OPTIONS.find(d => d.code === c) || { code: c, icon: '🎓', label: c })

  return (
    <div ref={containerRef} className="relative mt-1.5 w-full">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex min-h-[42px] w-full items-center justify-between gap-1 rounded-xl border px-2.5 py-2 text-xs transition outline-none',
          open
            ? 'border-amber-500 bg-white text-slate-900 ring-2 ring-amber-500/20 dark:border-amber-400/60 dark:bg-slate-900 dark:text-white dark:ring-amber-400/20'
            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.035] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[.05]'
        )}
      >
        <div className="flex flex-wrap items-center gap-1 overflow-hidden truncate">
          {isAll ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-white/15 dark:bg-white/[.07] dark:text-white/80">
              🌍 All Levels
            </span>
          ) : selectedItems.length > 0 ? (
            selectedItems.map(item => (
              <span
                key={item.code}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
              >
                <span>{item.icon}</span>
                <span>{item.code}</span>
              </span>
            ))
          ) : (
            <span className="text-slate-400 dark:text-white/40">Select level…</span>
          )}
        </div>

        <ChevronDown className={cn('size-3.5 shrink-0 text-slate-400 dark:text-white/50 transition-transform duration-200', open && 'rotate-180 text-amber-600 dark:text-amber-300')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-2.5 dark:border-white/20 dark:bg-slate-900 dark:text-white space-y-1">
          <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider">
            <span>Program Levels</span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="size-3" /></button>
          </div>

          <label
            className={cn(
              'flex items-center justify-between rounded-xl px-2 py-1.5 text-xs font-semibold cursor-pointer transition',
              isAll
                ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/30'
                : 'text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/[.07]'
            )}
          >
            <span>🌍 All Levels</span>
            {isAll && <Check className="size-3.5 text-amber-600 dark:text-amber-300" />}
            <input type="checkbox" checked={isAll} onChange={() => toggleCode('ALL')} className="sr-only" />
          </label>

          <hr className="my-1 border-slate-100 dark:border-white/10" />

          {PROGRAM_LEVEL_OPTIONS.map(opt => {
            const checked = !isAll && currentCodes.includes(opt.code)
            return (
              <label
                key={opt.code}
                className={cn(
                  'flex items-center justify-between rounded-xl px-2 py-1.5 text-xs cursor-pointer transition',
                  checked
                    ? 'bg-amber-50 text-slate-900 font-medium border border-amber-200 dark:bg-amber-400/15 dark:text-white dark:border-amber-400/30'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/[.06]'
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </div>
                {checked && <Check className="size-3.5 text-amber-600 dark:text-amber-300" />}
                <input type="checkbox" checked={checked} onChange={() => toggleCode(opt.code)} className="sr-only" />
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const [data, setData] = useState<any>()
  const [price, setPrice] = useState('999')
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('subscription')
  const [rates, setRates] = useState<ExchangeRateSettings>()
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState('')
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocumentSetting[]>([])
  const [documentsSaving, setDocumentsSaving] = useState(false)
  const [seedingTemplates, setSeedingTemplates] = useState(false)

  // Filters for Required Documents tab
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterCountry, setFilterCountry] = useState<string>('ALL')
  const [page, setPage] = useState<number>(1)
  const PAGE_SIZE = 10

  const load = () => getFinance().then((value: any) => {
    setData(value)
    setPrice(String((value.plans[0]?.priceMinor ?? 99900) / 100))
  })

  useEffect(() => {
    load()
    getExchangeRateSettingsFn().then(setRates).catch(() => {})
    getRequiredDocumentSettingsFn().then(setRequiredDocuments).catch(() => {})
  }, [])

  if (!data) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.03]" />

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings2 }[] = [
    { id: 'subscription', label: 'Subscription', icon: Settings2 },
    { id: 'required-documents', label: 'Documents', icon: FileText },
    { id: 'exchange-rates', label: 'Exchange rates', icon: CircleDollarSign },
    { id: 'general', label: 'General', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const filteredDocuments = requiredDocuments.filter(doc => {
    if (filterCategory !== 'ALL' && (doc.category || 'PERSONAL') !== filterCategory) return false
    if (filterCountry !== 'ALL') {
      const raw = (doc.countryCode || '').trim()
      if (!raw || raw === 'GLOBAL') {
        if (filterCountry === 'GLOBAL') return true
        return true
      }
      if (filterCountry === 'GLOBAL') return false
      const codes = raw.split(',').map(c => c.trim())
      return codes.includes(filterCountry)
    }
    return true
  })

  const totalPages = Math.ceil(filteredDocuments.length / PAGE_SIZE) || 1
  const safePage = Math.min(page, totalPages)
  const paginatedDocuments = filteredDocuments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return <div className="w-full max-w-6xl space-y-5">
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">Application prerequisites & Country Checklists</p>
          <h3 className="mt-2 font-display text-2xl">Documents settings</h3>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">Configure document requirements across student onboarding, university applications, and country-specific visa journeys.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={seedingTemplates} onClick={async () => {
            if (confirm('Load default country visa checklists (UK, USA, Canada, Germany, Australia, Ireland, New Zealand)?')) {
              setSeedingTemplates(true)
              try {
                const seeded = await seedDefaultCountryChecklistsFn()
                setRequiredDocuments(seeded)
                setFilterCategory('ALL')
                setFilterCountry('ALL')
                setPage(1)
              } catch (err: any) {
                alert(err.message || 'Failed to seed country checklists.')
              } finally {
                setSeedingTemplates(false)
              }
            }
          }} className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 disabled:opacity-50">
            <Sparkles className="size-3.5" />{seedingTemplates ? 'Loading templates…' : 'Seed Country Checklists'}
          </button>
          <button onClick={() => {
            const newDoc: RequiredDocumentSetting = {
              id: `document-${Date.now()}`,
              name: '',
              accept: '.pdf,.jpg,.jpeg,.png',
              active: true,
              sortOrder: Math.max(0, (requiredDocuments[0]?.sortOrder ?? 10) - 1),
              category: filterCategory !== 'ALL' ? (filterCategory as any) : 'PERSONAL',
              stage: 'PROFILE_ONBOARDING',
              countryCode: filterCountry !== 'ALL' && filterCountry !== 'GLOBAL' ? filterCountry : null,
            }
            setRequiredDocuments(current => [newDoc, ...current])
            setPage(1)
          }} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950">
            <Plus className="size-4" />Add document
          </button>
        </div>
      </div>

      {/* Sub-category tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.02] p-1.5">
        {[
          { id: 'ALL', label: 'All Documents', count: requiredDocuments.length },
          { id: 'PERSONAL', label: 'Personal & Identity', count: requiredDocuments.filter(d => (d.category || 'PERSONAL') === 'PERSONAL').length },
          { id: 'ACADEMIC', label: 'Academic & Scores', count: requiredDocuments.filter(d => d.category === 'ACADEMIC').length },
          { id: 'FINANCIAL', label: 'Financial Documents', count: requiredDocuments.filter(d => d.category === 'FINANCIAL').length },
          { id: 'VISA_COUNTRY', label: 'Visa', count: requiredDocuments.filter(d => d.category === 'VISA_COUNTRY').length },
        ].map(cTab => (
          <button
            key={cTab.id}
            onClick={() => { setFilterCategory(cTab.id); setPage(1) }}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition',
              filterCategory === cTab.id
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-white/45 hover:bg-white/[.05] hover:text-white'
            )}
          >
            {cTab.label}
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              filterCategory === cTab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white/50'
            )}>
              {cTab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Destination filter toolbar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white/40 flex items-center gap-1"><Filter className="size-3" /> Destination:</span>
          <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setPage(1) }} className="rounded-lg border border-white/10 bg-white/[.05] px-2.5 py-1.5 outline-none text-white text-xs">
            <option value="ALL" className="bg-slate-900">All Destinations</option>
            <option value="GLOBAL" className="bg-slate-900">Global (All Countries)</option>
            <option value="GBR" className="bg-slate-900">🇬🇧 United Kingdom (GBR)</option>
            <option value="USA" className="bg-slate-900">🇺🇸 United States (USA)</option>
            <option value="CAN" className="bg-slate-900">🇨🇦 Canada (CAN)</option>
            <option value="DEU" className="bg-slate-900">🇩🇪 Germany (DEU)</option>
            <option value="AUS" className="bg-slate-900">🇦🇺 Australia (AUS)</option>
            <option value="IRL" className="bg-slate-900">🇮🇪 Ireland (IRL)</option>
            <option value="NZL" className="bg-slate-900">🇳🇿 New Zealand (NZL)</option>
            <option value="ARE" className="bg-slate-900">🇦🇪 UAE (ARE)</option>
            <option value="SGP" className="bg-slate-900">🇸🇬 Singapore (SGP)</option>
            <option value="FRA" className="bg-slate-900">🇫🇷 France (FRA)</option>
            <option value="SWE" className="bg-slate-900">🇸🇪 Sweden (SWE)</option>
            <option value="ITA" className="bg-slate-900">🇮🇹 Italy (ITA)</option>
            <option value="ESP" className="bg-slate-900">🇪🇸 Spain (ESP)</option>
            <option value="NLD" className="bg-slate-900">🇳🇱 Netherlands (NLD)</option>
          </select>
        </div>
        <span className="text-[11px] text-white/35">Showing {filteredDocuments.length} of {requiredDocuments.length} documents</span>
      </div>

      {/* Document items list */}
      <div className="mt-5 space-y-3">
        {paginatedDocuments.map((document) => {
          const index = requiredDocuments.findIndex(item => item.id === document.id)

          return <div key={document.id} className="grid gap-3 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 md:grid-cols-[1.2fr_1fr_100px_110px_110px_130px_60px_auto_auto] md:items-end">
            <label className="text-[10px] text-white/40">Document name
              <input value={document.name} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="e.g. Passport" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/40" />
            </label>
            <label className="text-[10px] text-white/40">Accepted file types
              <input value={document.accept} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, accept: e.target.value } : item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/40" />
            </label>
            <label className="text-[10px] text-white/40">Category
              <select value={document.category || 'PERSONAL'} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, category: e.target.value as any } : item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-2 py-2.5 text-xs text-white outline-none">
                <option value="PERSONAL" className="bg-slate-900">Personal</option>
                <option value="ACADEMIC" className="bg-slate-900">Academic</option>
                <option value="FINANCIAL" className="bg-slate-900">Financial</option>
                <option value="VISA_COUNTRY" className="bg-slate-900">Visa</option>
              </select>
            </label>
            <label className="text-[10px] text-white/40">Workflow stage
              <select value={document.stage || 'PROFILE_ONBOARDING'} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, stage: e.target.value as any } : item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-2 py-2.5 text-xs text-white outline-none">
                <option value="PROFILE_ONBOARDING" className="bg-slate-900">Onboarding</option>
                <option value="APPLICATION_SUBMISSION" className="bg-slate-900">Application</option>
                <option value="VISA_PROCESSING" className="bg-slate-900">Visa Stage</option>
              </select>
            </label>
            <label className="text-[10px] text-white/40">Program levels
              <ProgramLevelMultiSelect
                value={document.programLevel}
                onChange={newLevel => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, programLevel: newLevel } : item))}
              />
            </label>
            <label className="text-[10px] text-white/40">Destinations
              <CountryMultiSelect
                value={document.countryCode}
                onChange={newCode => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, countryCode: newCode } : item))}
              />
            </label>
            <label className="text-[10px] text-white/40">Order
              <input type="number" min="0" value={document.sortOrder} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, sortOrder: Number(e.target.value) } : item))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-xs text-white outline-none" />
            </label>
            <label className="flex h-10 items-center gap-2 text-xs">
              <input type="checkbox" checked={document.active} onChange={e => setRequiredDocuments(current => current.map((item, i) => i === index ? { ...item, active: e.target.checked } : item))} />Required
            </label>
            <button title="Delete document" onClick={async () => { if (document.name && confirm(`Delete ${document.name}?`)) await deleteRequiredDocumentSettingFn(document.id); setRequiredDocuments(current => current.filter((_, i) => i !== index)) }} className="grid size-10 place-items-center rounded-xl border border-rose-400/20 text-rose-300 hover:bg-rose-400/10"><Trash2 className="size-4" /></button>
          </div>
        })}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-white/[.02] p-3 text-xs">
          <div className="text-[11px] text-white/40">
            Showing <span className="font-semibold text-white">{(safePage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-white">{Math.min(safePage * PAGE_SIZE, filteredDocuments.length)}</span> of <span className="font-semibold text-white">{filteredDocuments.length}</span> documents
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              disabled={safePage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 bg-white/[.05] px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={cn(
                  'size-8 rounded-lg text-xs transition font-semibold',
                  safePage === pNum
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/20'
                    : 'border border-white/10 bg-white/[.05] text-white/60 hover:bg-white/10'
                )}
              >
                {pNum}
              </button>
            ))}
            <button
              disabled={safePage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-white/10 bg-white/[.05] px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <button disabled={documentsSaving || requiredDocuments.some(item => !item.name.trim())} onClick={async () => { setDocumentsSaving(true); try { await Promise.all(requiredDocuments.map(saveRequiredDocumentSettingFn)); setRequiredDocuments(await getRequiredDocumentSettingsFn()) } finally { setDocumentsSaving(false) } }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 disabled:opacity-50"><Save className="size-4" />{documentsSaving ? 'Saving…' : 'Save requirements'}</button>
    </section>}
    {tab === 'general' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">General settings</h3><p className="mt-2 text-xs text-white/35">Platform identity, regional preferences, and support configuration will be managed here.</p></section>}
    {tab === 'notifications' && <section className="staff-card rounded-3xl border border-white/[.07] p-6"><h3 className="font-display text-xl">Notification settings</h3><p className="mt-2 text-xs text-white/35">Notification delivery preferences will appear here as channels are enabled.</p></section>}
  </div>
}

