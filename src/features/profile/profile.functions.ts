'use client'

import type { readStudentProfile, writeStudentProfile } from './profile.server'

type Profile = Awaited<ReturnType<typeof readStudentProfile>>
type SavedProfile = Awaited<ReturnType<typeof writeStudentProfile>>

async function request<T>(init?: RequestInit): Promise<T> {
  const response = await fetch('/api/profile', {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body as T
}

export const getMyProfileFn = () => request<Profile>()
export const saveMyProfileFn = ({ data }: { data: unknown }) =>
  request<SavedProfile>({ method: 'PUT', body: JSON.stringify(data) })
export const saveMyAgencyProfileFn=({data}:{data:unknown})=>request<SavedProfile>({method:'PATCH',body:JSON.stringify(data)})
export const addMyShortlistedUniversityFn=({universityId}:{universityId:string})=>request<SavedProfile>({method:'POST',body:JSON.stringify({universityId})})
