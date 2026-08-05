'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowUpDown, Building2, ChevronLeft, ChevronRight, CircleDollarSign, Download, FileSpreadsheet, Filter, Globe2, GraduationCap, LoaderCircle, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { universityCatalogQuery } from '@/features/admin/admin.queries'
import { createCourseImportJobFn, deleteCatalogEntityFn, listCatalogImportErrorsFn, listCatalogImportJobsFn, processCourseImportBatchFn, saveCountryFn, saveCourseFn, saveUniversityFn, setCourseFeeFn, type CatalogImportJob } from '@/features/admin/admin.functions'
import { cn } from '@/lib/utils'
import { createXlsx, createXlsxWorkbook, readSpreadsheet, readXlsxWorkbook } from '@/lib/xlsx'

type Tab = 'countries' | 'universities' | 'courses'
const singular = { countries: 'country', universities: 'university', courses: 'course' } as const satisfies Record<Tab, DeleteTarget['entity']>
type Form = Record<string, string | boolean | number | undefined>
type DeleteTarget = { entity: 'country' | 'university' | 'course'; id: string; name: string }
type Filters = { status: 'all' | 'active' | 'inactive'; country: string; university: string; level: string }
type SortState = { key: string; direction: 'asc' | 'desc' }
type ImportProgressState = { label: string; current: number; total: number }
const emptyFilters: Filters = { status: 'all', country: '', university: '', level: '' }
const columns: Record<Tab, string[]> = {
  countries: ['name', 'code', 'currencyCode', 'active'],
  universities: ['name', 'city', 'countryName', 'website', 'rankings', 'active'],
  courses: ['universityName', 'name', 'code', 'level', 'durationMonths', 'campus', 'intakeMonth', 'intakeYear', 'feeAmount', 'currencyCode', 'tuitionFee', 'ielts', 'ieltsMin', 'toefl', 'toeflMin', 'pte', 'pteMin', 'applicationDeadline', 'scholarshipAvailable', 'requirements', 'backlogRange', 'remarks', 'applicationMode', 'englishProficiency', 'entryRequirements', 'effectiveFrom', 'active'],
}
const samples: Record<Tab,string[]> = {
  countries:['Canada','CA','CAD','true'],
  universities:['University of Toronto','Toronto','Canada','https://www.utoronto.ca','QS World Ranking | 25; Webometrics World Ranking | 20','true'],
  courses:['University of Toronto','Computer Science','CS101','Undergraduate','48','St. George','January, May, September','2027','45000','CAD','CAD 45,000','6.5','6.0','90','80','65','58','2027-05-31','Yes','Bachelor degree','0-5','International applicants welcome','Online','IELTS/TOEFL/PTE accepted','Relevant bachelor degree',new Date().toISOString().slice(0,10),'true'],
}

export default function UniversityManagement() {
  const client = useQueryClient()
  const { data } = useSuspenseQuery(universityCatalogQuery)
  const [tab, setTab] = useState<Tab>('countries')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Form | null>(null)
  const [feeCourse, setFeeCourse] = useState<string | null>(null)
  const [fee, setFee] = useState({ amount: '', currencyCode: 'USD', effectiveFrom: new Date().toISOString().slice(0, 10) })
  const [notice, setNotice] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importTab, setImportTab] = useState<Tab>('countries')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null)
  const [importJobs, setImportJobs] = useState<CatalogImportJob[]>([])
  const input = useRef<HTMLInputElement>(null)
  const catalogInput = useRef<HTMLInputElement>(null)
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['staff', 'university-catalog'] }) }
  const refreshImportJobs = async () => setImportJobs(await listCatalogImportJobsFn())
  useEffect(() => { refreshImportJobs().catch(()=>undefined) }, [])
  const save = useMutation({
    mutationFn: async () => tab === 'countries' ? saveCountryFn(form) : tab === 'universities' ? saveUniversityFn({ ...form, rankings: parseRankings(String(form?.rankingsText ?? '')) }) : saveCourseFn({ ...form, intakeMonth: splitList(String(form?.intakeMonthText ?? '')) }),
    onSuccess: async () => { await refresh(); setForm(null) },
  })
  const remove = useMutation({
    mutationFn: ({ entity, id }: DeleteTarget) => deleteCatalogEntityFn({ entity, id }),
    onSuccess: async () => { await refresh(); setDeleteTarget(null) },
  })
  const setFeeMutation = useMutation({ mutationFn: () => setCourseFeeFn({ courseId: feeCourse, ...fee, amount: Number(fee.amount), effectiveFrom: new Date(fee.effectiveFrom).toISOString() }), onSuccess: async () => { await refresh(); setFeeCourse(null) } })

  const rows = tab === 'countries' ? data.countries : tab === 'universities' ? data.universities : data.courses
  const summaries = [{ icon: Globe2, label: 'Countries', count: data.countries.length }, { icon: Building2, label: 'Universities', count: data.universities.length }, { icon: GraduationCap, label: 'Courses', count: data.courses.length }]
  const filtered = useMemo(() => rows.filter((row: any) => {
    if (!JSON.stringify(row).toLowerCase().includes(search.toLowerCase())) return false
    if (filters.status !== 'all' && Boolean(row.active) !== (filters.status === 'active')) return false
    if (filters.country && (row.countryId ?? '') !== filters.country) return false
    if (filters.university && (row.universityId ?? '') !== filters.university) return false
    if (filters.level && (row.level ?? '') !== filters.level) return false
    return true
  }).sort((a: any, b: any) => {
    const left = sortValue(a, sort.key), right = sortValue(b, sort.key)
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }) * (sort.direction === 'asc' ? 1 : -1)
  }), [rows, search, filters, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeFilterCount = [filters.status !== 'all', Boolean(filters.country), Boolean(filters.university), Boolean(filters.level)].filter(Boolean).length
  useEffect(() => { setPage(1) }, [tab, search, filters, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])
  const changeTab = (value: Tab) => { setTab(value); setNotice(''); setSearch(''); setFilters(emptyFilters); setSort({ key: 'name', direction: 'asc' }) }
  const toggleSort = (key: string) => setSort(current => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' })
  const openNew = () => setForm(tab === 'countries'
    ? { name: '', code: '', currencyCode: 'USD', active: true }
    : tab === 'universities' ? { name: '', city: '', countryId: data.countries[0]?.id ?? '', website: '', rankingsText: '', rank: 0, active: true }
      : { universityId: data.universities[0]?.id ?? '', name: '', code: '', level: 'Undergraduate', durationMonths: 12, campus:'', intakeMonthText:'', intakeYear:'', tuitionFee:'', ielts:'', ieltsMin:'', toefl:'', toeflMin:'', pte:'', pteMin:'', applicationDeadline:'', scholarshipAvailable:'', requirements:'', backlogRange:'', remarks:'', applicationMode:'', englishProficiency:'', entryRequirements:'', active: true })

  const importFile = async (file?: File, targetTab: Tab = tab) => {
    if (!file) return
    setImportOpen(false)
    setImportProgress({ label: `Reading ${file.name}`, current: 0, total: 0 })
    try {
      const parsed = await readSpreadsheet(file)
      setImportProgress({ label: `Importing ${targetTab}`, current: 0, total: parsed.length })
      if(targetTab==='courses') {
        const jobs=await listCatalogImportJobsFn()
        const resumable=jobs.find(job=>job.status==='PROCESSING'&&job.fileName===file.name&&job.totalRows===parsed.length)
        let job=resumable??await createCourseImportJobFn({fileName:file.name,totalRows:parsed.length})
        setImportProgress({label:resumable?'Resuming course import':'Importing courses',current:job.processedRows,total:job.totalRows})
        for(let offset=job.processedRows;offset<parsed.length;offset+=250) {
          job=await processCourseImportBatchFn({jobId:job.id,startRow:offset+2,rows:parsed.slice(offset,offset+250)})
          setImportProgress({label:`Courses: ${job.createdRows.toLocaleString()} created, ${job.updatedRows.toLocaleString()} updated, ${job.failedRows.toLocaleString()} failed`,current:job.processedRows,total:job.totalRows})
        }
        await Promise.all([refresh(),refreshImportJobs()])
        setNotice(`Course import completed: ${job.createdRows} created, ${job.updatedRows} updated, and ${job.failedRows} failed.`)
        if(input.current) input.current.value=''
        setImportProgress(null)
        return
      }
      let imported = 0
      const courseMap = new Map(data.courses.map(course => [`${course.universityId}|${course.code.toLowerCase()}`, course]))
      for (const [index, row] of parsed.entries()) {
        if (!row.name) throw new Error(`Row ${index + 2}: name is required.`)
        if (targetTab === 'countries') {
          if (!row.code) throw new Error(`Row ${index + 2}: code is required.`)
          const currencyCode = row.currencyCode || row.currency
          if (!currencyCode) throw new Error(`Row ${index + 2}: currencyCode (or currency) is required.`)
          await saveCountryFn({ name: row.name, code: row.code, currencyCode, active: bool(row.active) })
        }
        if (targetTab === 'universities') {
          const country = data.countries.find(c => row.countryName
            ? c.name.toLowerCase() === row.countryName.toLowerCase()
            : c.code.toLowerCase() === row.countryCode?.toLowerCase())
          if (!country) throw new Error(`Unknown country: ${row.countryName || row.countryCode || 'not provided'}`)
          await saveUniversityFn({ ...row, countryId: country.id, rank: 0, rankings: parseRankings(row.rankings), active: bool(row.active) })
        }
        if (targetTab === 'courses') {
          const university = data.universities.find(u => u.name.toLowerCase() === row.universityName?.toLowerCase())
          if (!university) throw new Error(`Unknown university: ${row.universityName}`)
          if (!row.code) throw new Error(`Row ${index + 2}: course code is required.`)
          const key = `${university.id}|${row.code.trim().toLowerCase()}`
          const existing = courseMap.get(key)
          let saved: any
          try {
            saved = await saveCourseFn({ ...row, id: existing?.id, universityId: university.id, durationMonths: Number(row.durationMonths), intakeMonth: splitList(row.intakeMonth), active: bool(row.active) })
          } catch (error) {
            throw new Error(`Row ${index + 2} (${row.name}): ${error instanceof Error ? error.message : 'Import failed.'}`)
          }
          courseMap.set(key, { ...existing, ...saved, id: saved.id, universityId: university.id, universityName: university.name, code: row.code } as any)
          if (row.feeAmount && !existing) await setCourseFeeFn({ courseId: saved.id, amount: Number(row.feeAmount), currencyCode: row.currencyCode, effectiveFrom: new Date(row.effectiveFrom || Date.now()).toISOString() })
        }
        imported++
        setImportProgress({ label: `Importing ${targetTab}`, current: imported, total: parsed.length })
      }
      await refresh(); setNotice(`${imported} ${singular[targetTab]} record${imported === 1 ? '' : 's'} imported successfully.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Import failed.') }
    if (input.current) input.current.value = ''
    setImportProgress(null)
  }

  const importCatalogFile = async (file?: File) => {
    if (!file) return
    setImportOpen(false)
    setImportProgress({ label: `Reading ${file.name}`, current: 0, total: 0 })
    try {
      const workbook=await readXlsxWorkbook(file)
      const sheet=(name:string)=>Object.entries(workbook).find(([key])=>key.toLowerCase()===name.toLowerCase())?.[1]??[]
      const countryRows=sheet('Countries'), universityRows=sheet('Universities'), courseRows=sheet('Courses')
      if (!countryRows.length && !universityRows.length && !courseRows.length) throw new Error('Expected Countries, Universities, or Courses worksheets.')
      const total=countryRows.length+universityRows.length+courseRows.length
      let imported=0
      setImportProgress({label:'Importing countries',current:0,total})
      const countryMap=new Map(data.countries.flatMap(country=>[[country.name.toLowerCase(),country] as const,[country.code.toLowerCase(),country] as const]))
      for (const [index,row] of countryRows.entries()) { if(!row.name||!row.code) throw new Error(`Countries row ${index+2}: name and code are required.`); const existing=countryMap.get(row.code.toLowerCase()); const saved:any=await saveCountryFn({ ...row, id:existing?.id, active:bool(row.active) }); const country={...saved,id:saved.id,name:row.name,code:row.code,currencyCode:row.currencyCode,active:bool(row.active)}; countryMap.set(row.code.toLowerCase(),country); countryMap.set(row.name.toLowerCase(),country); imported++; setImportProgress({label:'Importing countries',current:imported,total}) }
      const universityMap=new Map(data.universities.map(university=>[university.name.toLowerCase(),university]))
      for (const [index,row] of universityRows.entries()) { const country=countryMap.get((row.countryName||row.countryCode||'').toLowerCase()); if(!row.name||!country) throw new Error(`Universities row ${index+2}: university name or country is invalid.`); const existing=universityMap.get(row.name.toLowerCase()); const saved:any=await saveUniversityFn({ ...row,id:existing?.id,countryId:country.id,rank:0,rankings:parseRankings(row.rankings),active:bool(row.active) }); universityMap.set(row.name.toLowerCase(),{...saved,id:saved.id,name:row.name}); imported++; setImportProgress({label:'Importing universities',current:imported,total}) }
      const courseMap=new Map(data.courses.map(course=>[`${course.universityName.toLowerCase()}|${course.code.toLowerCase()}`,course]))
      for (const [index,row] of courseRows.entries()) { const university=universityMap.get(row.universityName?.trim().toLowerCase()),feeAmount=Number(String(row.feeAmount??'').replaceAll(',','')),currencyCode=String(row.currencyCode??'').trim().toUpperCase(); if(!row.name||!row.code||!university) throw new Error(`Courses row ${index+2}: course, code, or university is invalid.`);if(!Number.isFinite(feeAmount)||feeAmount<=0)throw new Error(`Courses row ${index+2}: feeAmount is required and must be positive.`);if(!/^[A-Z]{3}$/.test(currencyCode))throw new Error(`Courses row ${index+2}: currencyCode must be a 3-letter ISO code.`); const key=`${row.universityName.trim().toLowerCase()}|${row.code.trim().toLowerCase()}`,existing=courseMap.get(key); const saved:any=await saveCourseFn({...row,id:existing?.id,universityId:university.id,durationMonths:Number(row.durationMonths),intakeMonth:splitList(row.intakeMonth),tuitionFee:row.tuitionFee||`${currencyCode} ${feeAmount}`,active:bool(row.active)}); courseMap.set(key,{...existing,...saved,id:saved.id,universityId:university.id,universityName:row.universityName,code:row.code} as any); await setCourseFeeFn({courseId:saved.id,amount:feeAmount,currencyCode,effectiveFrom:new Date(row.effectiveFrom||Date.now()).toISOString()}); imported++; setImportProgress({label:'Importing courses',current:imported,total}) }
      await refresh(); setNotice(`Full catalog imported: ${countryRows.length} countries, ${universityRows.length} universities, and ${courseRows.length} courses.`)
    } catch(error) { setNotice(error instanceof Error?error.message:'Catalog import failed.') }
    if(catalogInput.current) catalogInput.current.value=''
    setImportProgress(null)
  }

  return <div className="space-y-5">
    <section className="catalog-card rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300/70">Super admin catalog</p><h2 className="mt-1 font-display text-2xl">Study catalog control center</h2><p className="mt-2 text-xs text-white/38">Effective-dated pricing preserves every fee change and protects student quotes.</p></div><div className="flex-1" />
        <div className="flex flex-wrap justify-end gap-2"><button onClick={()=>setImportOpen(true)} className="action"><FileSpreadsheet className="size-4" /> Excel / CSV import</button><button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#111827]"><Plus className="size-4" /> Add {singular[tab]}</button></div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">{summaries.map(({ icon: Icon, label, count }) => <div key={label} className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4"><Icon className="size-4 text-amber-300" /><p className="mt-2 font-display text-2xl">{count}</p><p className="text-[10px] text-white/35">{label}</p></div>)}</div>
    </section>

    <section className="catalog-card overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center sm:p-5"><div className="catalog-tabs flex gap-1 rounded-xl bg-black/20 p-1">{(['countries','universities','courses'] as Tab[]).map(value => <button key={value} onClick={() => changeTab(value)} className={cn('catalog-tab rounded-lg px-4 py-2 text-xs font-semibold capitalize', tab === value ? 'catalog-tab-active bg-white/10 text-amber-300' : 'text-white/40')}>{value}</button>)}</div><div className="relative lg:ml-auto lg:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}`} className="field pl-9" /></div><button onClick={()=>setFilterOpen(true)} className={cn('action justify-center', activeFilterCount && 'border-amber-300/30 text-amber-300')}><Filter className="size-4" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</button></div>
      {notice && <p className="mx-5 mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.06] px-4 py-3 text-xs text-amber-200">{notice}</p>}
      {importJobs.length>0 && <ImportHistory jobs={importJobs} downloadErrors={downloadImportErrors} />}
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="text-[9px] uppercase tracking-wider text-white/30">{tableHeaders(tab).map(header => <th key={header.label} className="px-5 py-4">{header.key ? <button onClick={()=>toggleSort(header.key!)} className={cn('inline-flex items-center gap-1.5 transition hover:text-amber-300', sort.key === header.key && 'text-amber-300')}><span>{header.label}</span><ArrowUpDown className="size-3" /></button> : header.label}</th>)}<th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{paginated.map((row: any) => <CatalogRow key={row.id} tab={tab} row={row} onEdit={() => setForm({ ...row, rankingsText: row.rankings?.map((r:any)=>`${r.name} | ${r.value}`).join('\n') ?? '', intakeMonthText: row.intakeMonth?.join(', ') ?? '' })} onFee={() => { setFeeCourse(row.id); setFee({ amount: row.fees?.[0]?.amount ?? '', currencyCode: row.fees?.[0]?.currencyCode ?? 'USD', effectiveFrom: new Date().toISOString().slice(0,10) }) }} onDelete={() => { remove.reset(); setDeleteTarget({ entity: singular[tab], id: row.id, name: row.name }) }} />)}</tbody></table></div>
      {!filtered.length && <div className="p-12 text-center"><FileSpreadsheet className="mx-auto size-8 text-white/15" /><p className="mt-3 text-sm text-white/35">No {tab} found.</p></div>}
      {filtered.length > 0 && <TablePagination page={page} pageCount={pageCount} pageSize={pageSize} total={filtered.length} setPage={setPage} setPageSize={setPageSize} />}
    </section>

    {form && <Modal title={`${form.id ? 'Edit' : 'Add'} ${singular[tab]}`} close={() => setForm(null)} error={save.error} submit={() => save.mutate()} pending={save.isPending}><EntityForm tab={tab} form={form} setForm={setForm} countries={data.countries} universities={data.universities} /></Modal>}
    {feeCourse && <Modal title="Set new course fee" close={() => setFeeCourse(null)} error={setFeeMutation.error} submit={() => setFeeMutation.mutate()} pending={setFeeMutation.isPending}><label>Amount<input required type="number" min="0" step="0.01" value={fee.amount} onChange={e => setFee({ ...fee, amount: e.target.value })} className="field mt-2" /></label><label>Currency<input required maxLength={3} value={fee.currencyCode} onChange={e => setFee({ ...fee, currencyCode: e.target.value.toUpperCase() })} className="field mt-2" /></label><label>Effective from<input required type="date" value={fee.effectiveFrom} onChange={e => setFee({ ...fee, effectiveFrom: e.target.value })} className="field mt-2" /></label><p className="rounded-xl bg-indigo-400/[.07] p-3 text-[10px] leading-4 text-indigo-200/70">The previous fee remains in history and is closed at this effective date. Existing student quotes are unchanged.</p></Modal>}
    {deleteTarget && <DeleteModal target={deleteTarget} close={() => { if (!remove.isPending) setDeleteTarget(null) }} confirmDelete={() => remove.mutate(deleteTarget)} pending={remove.isPending} error={remove.error} />}
    {importOpen && <ImportModal close={()=>setImportOpen(false)} selectCatalog={()=>catalogInput.current?.click()} selectTab={value=>{setImportTab(value);setTimeout(()=>input.current?.click(),0)}} />}
    {filterOpen && <FilterDrawer tab={tab} filters={filters} setFilters={setFilters} countries={data.countries} universities={data.universities} courses={data.courses} resultCount={filtered.length} close={()=>setFilterOpen(false)} />}
    {importProgress && <ImportProgress progress={importProgress} />}
    <input ref={catalogInput} type="file" accept=".xlsx" className="hidden" onChange={e=>importCatalogFile(e.target.files?.[0])}/><input ref={input} type="file" accept=".xlsx,.csv,text/csv" className="hidden" onChange={e=>importFile(e.target.files?.[0],importTab)}/>
  </div>
}

function CatalogRow({ tab, row, onEdit, onFee, onDelete }: any) {
  const cells = tab === 'countries' ? [row.name, row.code, row.currencyCode] : tab === 'universities' ? [row.name, row.city, row.countryName, row.rankings?.length ? `${row.rankings.length} rankings` : 'Not ranked'] : [row.name, row.code, row.universityName, row.campus || '—', row.intakeMonth?.join(', ') || '—', row.fees?.[0] ? `${row.fees[0].currencyCode} ${Number(row.fees[0].amount).toLocaleString()}` : row.tuitionFee || 'Not set']
  return <tr className="border-t border-white/[.05] text-xs"><td className="px-5 py-4"><span className={cn('rounded-full px-2 py-1 text-[9px] font-bold', row.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-white/30')}>{row.active ? 'ACTIVE' : 'INACTIVE'}</span></td>{cells.map((cell: any, i: number) => <td key={i} className={cn('px-5 py-4 text-white/45', i === 0 && 'font-semibold text-white/85')}>{cell}</td>)}<td className="px-5 py-4"><div className="flex justify-end gap-1">{tab === 'courses' && <button title="Set fee" onClick={onFee} className="icon"><CircleDollarSign className="size-4" /></button>}<button title="Edit" onClick={onEdit} className="icon"><Pencil className="size-4" /></button><button title="Delete" onClick={onDelete} className="icon hover:text-rose-300"><Trash2 className="size-4" /></button></div></td></tr>
}
function tableHeaders(tab: Tab) {
  return tab === 'countries'
    ? [{label:'Status',key:'active'},{label:'Country',key:'name'},{label:'Code',key:'code'},{label:'Currency',key:'currencyCode'}]
    : tab === 'universities'
      ? [{label:'Status',key:'active'},{label:'University',key:'name'},{label:'City',key:'city'},{label:'Country',key:'countryName'},{label:'Rankings',key:'rankings'}]
      : [{label:'Status',key:'active'},{label:'Course',key:'name'},{label:'Code',key:'code'},{label:'University',key:'universityName'},{label:'Campus',key:'campus'},{label:'Intakes',key:'intakeMonth'},{label:'Current fee',key:'fee'}]
}
function sortValue(row: any, key: string) {
  if (key === 'active') return row.active ? '0' : '1'
  if (key === 'rankings') return String(row.rankings?.length ?? 0)
  if (key === 'intakeMonth') return row.intakeMonth?.join(', ') ?? ''
  if (key === 'fee') return String(row.fees?.[0]?.amount ?? row.tuitionFee ?? '')
  return String(row[key] ?? '')
}
function ImportHistory({jobs,downloadErrors}:{jobs:CatalogImportJob[];downloadErrors:(job:CatalogImportJob)=>void}) {
  return <div className="mx-5 mt-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4"><div className="flex items-center gap-2"><FileSpreadsheet className="size-4 text-amber-300"/><h3 className="text-xs font-semibold">Recent course imports</h3></div><div className="mt-3 space-y-2">{jobs.slice(0,5).map(job=><div key={job.id} className="flex flex-col gap-2 rounded-xl border border-white/[.05] px-3 py-2.5 text-[10px] text-white/40 sm:flex-row sm:items-center"><span className="min-w-0 flex-1 truncate font-semibold text-white/65">{job.fileName}</span><span>{job.processedRows.toLocaleString()}/{job.totalRows.toLocaleString()} processed</span><span className="text-emerald-300">{job.createdRows.toLocaleString()} created</span><span className="text-sky-300">{job.updatedRows.toLocaleString()} updated</span><span className={job.failedRows?'text-rose-300':'text-white/35'}>{job.failedRows.toLocaleString()} failed</span>{job.failedRows>0&&<button onClick={()=>downloadErrors(job)} className="font-semibold text-amber-300 hover:text-amber-200">Download errors</button>}</div>)}</div></div>
}
function TablePagination({ page, pageCount, pageSize, total, setPage, setPageSize }: { page:number; pageCount:number; pageSize:number; total:number; setPage:(page:number)=>void; setPageSize:(size:number)=>void }) {
  const first=(page-1)*pageSize+1, last=Math.min(page*pageSize,total)
  return <div className="flex flex-col gap-3 border-t border-white/[.06] px-5 py-4 text-[11px] text-white/40 sm:flex-row sm:items-center"><span>Showing {first}–{last} of {total}</span><label className="flex items-center gap-2 sm:ml-auto">Rows per page<select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} className="field w-auto py-2"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label><div className="flex items-center gap-2"><button aria-label="Previous page" disabled={page===1} onClick={()=>setPage(page-1)} className="icon disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft className="size-4" /></button><span className="min-w-20 text-center">Page {page} of {pageCount}</span><button aria-label="Next page" disabled={page===pageCount} onClick={()=>setPage(page+1)} className="icon disabled:cursor-not-allowed disabled:opacity-25"><ChevronRight className="size-4" /></button></div></div>
}
function ImportProgress({ progress }: { progress: ImportProgressState }) {
  const percentage=progress.total ? Math.round((progress.current/progress.total)*100) : 0
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="import-progress-title"><section className="catalog-modal w-full max-w-md rounded-3xl border border-amber-300/15 bg-[#0b1122] p-7 text-center shadow-2xl shadow-black/50"><div className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/[.08]"><LoaderCircle className="size-6 animate-spin text-amber-300" /></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-amber-300/65">Catalog upload in progress</p><h3 id="import-progress-title" className="mt-2 font-display text-xl capitalize">{progress.label}</h3>{progress.total > 0 ? <><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-amber-400 transition-[width] duration-300" style={{width:`${percentage}%`}} /></div><div className="mt-3 flex items-center justify-between text-[11px] text-white/40"><span>{progress.current.toLocaleString()} of {progress.total.toLocaleString()} records</span><span className="font-semibold text-amber-300">{percentage}%</span></div></> : <p className="mt-5 text-xs text-white/40">Reading and validating the selected file…</p>}<p className="mt-6 rounded-xl border border-white/[.06] bg-white/[.025] px-4 py-3 text-[10px] leading-4 text-white/35">Keep this page open until the upload finishes. Large catalogs may take several minutes.</p></section></div>
}
function FilterDrawer({ tab, filters, setFilters, countries, universities, courses, resultCount, close }: { tab:Tab; filters:Filters; setFilters:(filters:Filters)=>void; countries:any[]; universities:any[]; courses:any[]; resultCount:number; close:()=>void }) {
  const levels=[...new Set(courses.map(course=>course.level).filter(Boolean))].sort()
  return <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm" role="presentation" onMouseDown={event=>{if(event.currentTarget===event.target) close()}}><aside role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title" className="catalog-modal ml-auto flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#0b1122] shadow-2xl"><header className="flex items-start gap-3 border-b border-white/[.07] p-6"><div className="grid size-10 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Filter className="size-4" /></div><div><h3 id="filter-drawer-title" className="font-display text-xl">Filter {tab}</h3><p className="mt-1 text-[11px] text-white/35">Refine the records shown in the table.</p></div><button onClick={close} aria-label="Close filters" className="icon ml-auto"><X className="size-4" /></button></header><div className="flex-1 space-y-5 overflow-y-auto p-6 text-[11px] font-semibold text-white/55"><label>Status<select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value as Filters['status']})} className="field mt-2"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>{tab==='universities'&&<label>Country<select value={filters.country} onChange={e=>setFilters({...filters,country:e.target.value})} className="field mt-2"><option value="">All countries</option>{countries.map(country=><option key={country.id} value={country.id}>{country.name}</option>)}</select></label>}{tab==='courses'&&<><label>University<select value={filters.university} onChange={e=>setFilters({...filters,university:e.target.value})} className="field mt-2"><option value="">All universities</option>{universities.map(university=><option key={university.id} value={university.id}>{university.name}</option>)}</select></label><label>Course level<select value={filters.level} onChange={e=>setFilters({...filters,level:e.target.value})} className="field mt-2"><option value="">All levels</option>{levels.map(level=><option key={level} value={level}>{level}</option>)}</select></label></>}</div><footer className="border-t border-white/[.07] p-5"><p className="mb-3 text-center text-[11px] text-white/40">{resultCount} matching record{resultCount===1?'':'s'}</p><div className="flex gap-3"><button onClick={()=>setFilters(emptyFilters)} className="action flex-1 justify-center">Reset</button><button onClick={close} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#111827]">Show results</button></div></footer></aside></div>
}
function EntityForm({ tab, form, setForm, countries, universities }: any) {
  const field = (key: string, label: string, type='text') => <label>{label}<input required={['name','code','city','level','durationMonths'].includes(key)} type={type} value={String(form[key] ?? '')} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })} className="field mt-2" /></label>
  const area = (key:string,label:string,placeholder='') => <label>{label}<textarea value={String(form[key] ?? '')} placeholder={placeholder} onChange={e=>setForm({...form,[key]:e.target.value})} className="field mt-2 min-h-20 resize-y" /></label>
  return <>{field('name', tab === 'countries' ? 'Country name' : tab === 'universities' ? 'University name' : 'Course name')}{tab === 'countries' && <>{field('code','ISO country code')}{field('currencyCode','Currency code')}</>}{tab === 'universities' && <><label>Country<select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} className="field mt-2">{countries.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{field('city','City')}{field('website','Website URL','url')}{area('rankingsText','University rankings','Webometrics World Ranking | 6954\nWebometrics National Ranking | 154')}</>}{tab === 'courses' && <><label>University<select value={form.universityId} onChange={e => setForm({ ...form, universityId: e.target.value })} className="field mt-2">{universities.map((u:any)=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>{field('code','Course code')}{field('level','Level')}{field('durationMonths','Duration (months)','number')}<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{field('campus','Campus')}{field('intakeMonthText','Intake months (comma separated)')}{field('intakeYear','Intake year')}{field('tuitionFee','Tuition fee display')}{field('applicationDeadline','Application deadline')}{field('scholarshipAvailable','Scholarship available')}{field('applicationMode','Application mode')}{field('backlogRange','Backlog range')}{field('ielts','IELTS')}{field('ieltsMin','IELTS minimum')}{field('toefl','TOEFL')}{field('toeflMin','TOEFL minimum')}{field('pte','PTE')}{field('pteMin','PTE minimum')}</div>{area('englishProficiency','English proficiency')}{area('requirements','Requirements')}{area('entryRequirements','Entry requirements')}{area('remarks','Remarks')}</>}<label className="flex items-center gap-3 rounded-xl border border-white/[.08] p-3"><input type="checkbox" checked={Boolean(form.active)} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active and available</label></>
}
function Modal({ title, close, children, error, submit, pending }: any) { return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><form onSubmit={e => { e.preventDefault(); submit() }} className="catalog-modal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1122] p-6"><div className="flex items-center"><h3 className="font-display text-xl capitalize">{title}</h3><button type="button" onClick={close} className="icon ml-auto"><X className="size-4" /></button></div><div className="mt-6 space-y-4 text-[11px] font-semibold text-white/55">{children}</div>{error && <p className="mt-4 text-xs text-rose-300">{error.message}</p>}<div className="mt-6 flex gap-3"><button type="button" onClick={close} className="action flex-1 justify-center">Cancel</button><button disabled={pending} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-[#111827] disabled:opacity-50">{pending ? 'Saving…' : 'Save'}</button></div></form></div> }
function DeleteModal({ target, close, confirmDelete, pending, error }: { target: DeleteTarget; close: () => void; confirmDelete: () => void; pending: boolean; error: Error | null }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-md" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) close() }}><section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="catalog-modal w-full max-w-md overflow-hidden rounded-3xl border border-rose-400/20 bg-[#0b1122] shadow-2xl shadow-black/50"><div className="border-b border-white/[.07] p-6"><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/10"><AlertTriangle className="size-5 text-rose-300" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-rose-300/70">Permanent action</p><h3 id="delete-title" className="mt-1 font-display text-xl">Delete {target.entity}?</h3></div><button type="button" onClick={close} disabled={pending} aria-label="Close delete confirmation" className="icon ml-auto shrink-0 disabled:opacity-40"><X className="size-4" /></button></div><p id="delete-description" className="delete-modal-copy mt-5 text-sm leading-6 text-white/55">You’re about to permanently delete <strong className="delete-modal-name font-semibold text-white">{target.name}</strong>. This action cannot be undone.</p><div className="delete-modal-warning mt-4 rounded-2xl border border-rose-400/10 bg-rose-400/[.06] px-4 py-3 text-xs leading-5 text-rose-100/65">If this record is used by applications or other catalog entries, deletion will be safely blocked. You can deactivate it instead.</div>{error && <p role="alert" className="delete-modal-error mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs leading-5 text-rose-200">{error.message}</p>}</div><div className="delete-modal-footer flex flex-col-reverse gap-3 bg-white/[.02] p-5 sm:flex-row"><button type="button" onClick={close} disabled={pending} className="action flex-1 justify-center disabled:opacity-40">Keep {target.entity}</button><button type="button" onClick={confirmDelete} disabled={pending} className="delete-modal-confirm flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="size-4" />{pending ? 'Deleting…' : `Delete ${target.entity}`}</button></div></section></div>
}
function ImportModal({ close, selectCatalog, selectTab }: { close:()=>void; selectCatalog:()=>void; selectTab:(tab:Tab)=>void }) {
  const options = [
    { key:'catalog', title:'Full catalog', description:'Countries, universities, courses, and fees in one workbook.', template:downloadCatalogTemplate, select:selectCatalog },
    ...(['countries','universities','courses'] as Tab[]).map(value=>({ key:value, title:value[0].toUpperCase()+value.slice(1), description:`Import only ${value}.`, template:()=>downloadTemplate(value), select:()=>selectTab(value) })),
  ]
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><section className="catalog-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1122] p-6"><div className="flex items-start gap-4"><div><h3 className="font-display text-xl">Excel / CSV import center</h3><p className="mt-1 text-xs text-white/35">Import individual lists from Excel or CSV. Full catalog imports require an Excel workbook.</p></div><button onClick={close} className="icon ml-auto"><X className="size-4" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{options.map(option=><article key={option.key} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><FileSpreadsheet className="size-5 text-amber-300"/><h4 className="mt-3 text-sm font-semibold">{option.title}</h4><p className="mt-1 min-h-8 text-[10px] leading-4 text-white/35">{option.description}</p><div className="mt-4 flex gap-2"><button onClick={option.template} className="action flex-1 justify-center px-2"><Download className="size-3.5"/> Template</button><button onClick={option.select} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-2 py-2.5 text-[10px] font-bold text-[#111827]"><Upload className="size-3.5"/> Select file</button></div></article>)}</div><button onClick={close} className="action mt-5 w-full justify-center">Cancel</button></section></div>
}
function bool(value?: string) { return !['false','0','no','inactive'].includes(String(value ?? 'true').toLowerCase()) }
async function downloadTemplate(tab: Tab) {
  download(await createXlsx(tab, [columns[tab], samples[tab]]),`${tab}-import-template.xlsx`)
}
async function downloadCatalogTemplate() { download(await createXlsxWorkbook((['countries','universities','courses'] as Tab[]).map(tab=>({name:tab[0].toUpperCase()+tab.slice(1),rows:[columns[tab],samples[tab]]}))),'full-university-catalog-template.xlsx') }
function download(blob:Blob,name:string) { const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000) }
async function downloadImportErrors(job:CatalogImportJob) {
  const errors=await listCatalogImportErrorsFn(job.id)
  const headers=['rowNumber','message',...Array.from(new Set(errors.flatMap(error=>Object.keys(error.rowData))))]
  const csv=[headers, ...errors.map(error=>headers.map(header=>header==='rowNumber'?String(error.rowNumber):header==='message'?error.message:error.rowData[header]??''))].map(row=>row.map(csvCell).join(',')).join('\r\n')
  download(new Blob([csv],{type:'text/csv;charset=utf-8'}),`${job.fileName.replace(/\.[^.]+$/,'')}-errors.csv`)
}
function csvCell(value:string) { return /[",\r\n]/.test(value)?`"${value.replace(/"/g,'""')}"`:value }
function splitList(value: string) { return String(value ?? '').split(/[,;\n]/).map(item=>normalizeMonth(item)).filter(Boolean) }
function normalizeMonth(value:string){const key=value.trim().toLowerCase().slice(0,3),months:Record<string,string>={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December',fal:'September',spr:'January'};return months[key]??''}
function parseRankings(value: string) {
  return String(value ?? '')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .split(/[;\n]/)
    .map(item=>item.trim())
    .filter(Boolean)
    .map(item=>{
      const match=item.match(/^(.*?)\s*\|\s*(.+)$/) ?? item.match(/^(.*?)\s+-\s+(.+)$/)
      if(!match) throw new Error(`Invalid ranking "${item}". Use Ranking name | value or Ranking name - value.`)
      return { name:match[1].trim(), value:match[2].trim() }
    })
}
