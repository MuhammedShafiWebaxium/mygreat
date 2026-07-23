'use client'

import type { createStaffUser, listStaffUsers, listStudentUsers, readStaffQueue, updateStaffUser } from './admin.server'

type StaffList = Awaited<ReturnType<typeof listStaffUsers>>
type StudentList = Awaited<ReturnType<typeof listStudentUsers>>
type StaffQueue = Awaited<ReturnType<typeof readStaffQueue>>
type CreatedStaff = Awaited<ReturnType<typeof createStaffUser>>
type UpdatedStaff = Awaited<ReturnType<typeof updateStaffUser>>

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
export const listStudentsFn = () => request<StudentList>('students')
export const updateStaffFn = ({ data }: { data: unknown }) => request<UpdatedStaff>('updateStaff', data)
