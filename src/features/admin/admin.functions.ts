'use client'

import type { createStaffUser, listAssignmentOptions, listStaffUsers, listStudentUsers, readPrimaryApplicationQueue, readStaffQueue, updateStaffUser } from './admin.server'
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
type PrimaryApplicationQueue = Awaited<ReturnType<typeof readPrimaryApplicationQueue>>

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
export const listStudentsFn = () => request<StudentList>('students')
export const updateStaffFn = ({ data }: { data: unknown }) => request<UpdatedStaff>('updateStaff', data)
export const listPartnersFn = () => request<PartnerList>('partners')
export const reviewPartnerFn = ({ data }: { data: unknown }) => request<ReviewedPartner>('reviewPartner', data)
export const getAssignmentOptionsFn = () => request<AssignmentOptions>('assignmentOptions')
export const assignStudentFn = ({ data }: { data: unknown }) => request<{ id: string; assignedPartnerCompanyId: string | null }>('assignStudent', data)
export const listUniversityCatalogFn = () => request<Catalog>('universityCatalog')
export const saveCountryFn = (data: unknown) => request('saveCountry', data)
export const saveUniversityFn = (data: unknown) => request('saveUniversity', data)
export const saveCourseFn = (data: unknown) => request('saveCourse', data)
export const setCourseFeeFn = (data: unknown) => request('setCourseFee', data)
export const deleteCatalogEntityFn = (data: unknown) => request('deleteCatalogEntity', data)
