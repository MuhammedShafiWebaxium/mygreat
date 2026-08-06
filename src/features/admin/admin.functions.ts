'use client'

import type { createStaffUser, listAssignmentOptions, listStaffUsers, listStudentUsers, listUniversityPrograms, readDocumentReviewQueue, readPrimaryApplicationQueue, readStaffQueue, updateStaffUser } from './admin.server'
import type { listPartnerApplications, reviewPartner } from '@/features/partners/partner.server'
import type { Catalog } from '@/features/university-management/university.server'

type StaffList = Awaited<ReturnType<typeof listStaffUsers>>
type StudentList = Awaited<ReturnType<typeof listStudentUsers>>
type StaffQueue = Awaited<ReturnType<typeof readStaffQueue>>
type CreatedStaff = Awaited<ReturnType<typeof createStaffUser>>
type UpdatedStaff = Awaited<ReturnType<typeof updateStaffUser>>
type PartnerList = Awaited<ReturnType<typeof listPartnerApplications>>
type ReviewedPartner = Awaited<ReturnType<typeof reviewPartner>>
type AssignmentOptions = Awaited<ReturnType<typeof listAssignmentOptions>>
type UniversityPrograms = Awaited<ReturnType<typeof listUniversityPrograms>>
type PrimaryApplicationQueue = Awaited<ReturnType<typeof readPrimaryApplicationQueue>>
type DocumentReviewQueue = Awaited<ReturnType<typeof readDocumentReviewQueue>>

async function request<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/admin?action=${encodeURIComponent(action)}`, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body as T
}

export const createStaffFn = ({ data }: { data: unknown }) => request<CreatedStaff>('createStaff', data)
export const listStaffFn = () => request<StaffList>('listStaff')
export const getStaffQueueFn = () => request<StaffQueue>('queue')
export const getPrimaryApplicationQueueFn = () => request<PrimaryApplicationQueue>('primaryApplications')
export const getDocumentReviewQueueFn = () => request<DocumentReviewQueue>('documentReviews')
export const listStudentsFn = () => request<StudentList>('students')
export const updateStaffFn = ({ data }: { data: unknown }) => request<UpdatedStaff>('updateStaff', data)
export const listPartnersFn = () => request<PartnerList>('partners')
export const reviewPartnerFn = ({ data }: { data: unknown }) => request<ReviewedPartner>('reviewPartner', data)
export const getAssignmentOptionsFn = () => request<AssignmentOptions>('assignmentOptions')
export const getUniversityProgramsFn = async (universityId: string) => {
  const response = await fetch(`/api/admin?action=universityPrograms&universityId=${encodeURIComponent(universityId)}`)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Unable to load university programs.')
  return body as UniversityPrograms
}
export const assignStudentFn = ({ data }: { data: unknown }) => request<{ id: string; assignedPartnerCompanyId: string | null }>('assignStudent', data)
export const listUniversityCatalogFn = () => request<Catalog>('universityCatalog')
export const saveCountryFn = (data: unknown) => request('saveCountry', data)
export const saveUniversityFn = (data: unknown) => request('saveUniversity', data)
export const saveCourseFn = (data: unknown) => request('saveCourse', data)
export const setCourseFeeFn = (data: unknown) => request('setCourseFee', data)
export const deleteCatalogEntityFn = (data: unknown) => request('deleteCatalogEntity', data)
export type CatalogImportJob = { id:string; entityType:string; fileName:string; totalRows:number; processedRows:number; createdRows:number; updatedRows:number; skippedRows:number; failedRows:number; status:string; createdAt:string; completedAt:string|null }
export type CatalogImportError = { rowNumber:number; message:string; rowData:Record<string,string> }
export const createCourseImportJobFn = (data:{fileName:string;totalRows:number}) => request<CatalogImportJob>('createCourseImportJob',data)
export const processCourseImportBatchFn = (data:{jobId:string;startRow:number;rows:Record<string,string>[]}) => request<CatalogImportJob>('processCourseImportBatch',data)
export const readCatalogImportJobFn = (jobId:string) => request<CatalogImportJob>('readCatalogImportJob',{jobId})
export const listCatalogImportJobsFn = () => request<CatalogImportJob[]>('catalogImportJobs')
export const listCatalogImportErrorsFn = (jobId:string) => request<CatalogImportError[]>('catalogImportErrors',{jobId})
export type ExchangeRateSettings={provider:string;sourceUrl:string;rates:Array<{currencyCode:string;rateToInr:number;provider:string;providerDate:string;updatedAt:string}>;coverage:{total:number;converted:number}}
export const getExchangeRateSettingsFn=()=>request<ExchangeRateSettings>('exchangeRates')
export const refreshExchangeRatesFn=()=>request<ExchangeRateSettings>('refreshExchangeRates',{})
export type RequiredDocumentSetting = {
  id: string
  name: string
  accept: string
  active: boolean
  sortOrder: number
  category?: 'PERSONAL' | 'ACADEMIC' | 'FINANCIAL' | 'VISA_COUNTRY'
  stage?: 'PROFILE_ONBOARDING' | 'APPLICATION_SUBMISSION' | 'VISA_PROCESSING'
  countryCode?: string | null
  programLevel?: string | null
  financialType?: string | null
}
export const getRequiredDocumentSettingsFn = () => request<RequiredDocumentSetting[]>('requiredDocuments')
export const saveRequiredDocumentSettingFn = (data: RequiredDocumentSetting) => request<RequiredDocumentSetting>('saveRequiredDocument', data)
export const deleteRequiredDocumentSettingFn = (id: string) => request<{ ok: boolean }>('deleteRequiredDocument', { id })
export const seedDefaultCountryChecklistsFn = () => request<RequiredDocumentSetting[]>('seedDefaultCountryChecklists', {})
