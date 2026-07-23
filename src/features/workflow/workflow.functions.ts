'use client'

import type { createApplication, readStudentDashboard, setTaskCompleted, updateApplication } from './workflow.server'

type Dashboard = Awaited<ReturnType<typeof readStudentDashboard>>
type CreatedApplication = Awaited<ReturnType<typeof createApplication>>
type UpdatedTask = Awaited<ReturnType<typeof setTaskCompleted>>
type UpdatedApplication = Awaited<ReturnType<typeof updateApplication>>

async function request<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch('/api/workflow', {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify({ action, data }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body as T
}

export const getMyDashboardFn = () => request<Dashboard>('dashboard')
export const createApplicationFn = ({ data }: { data: unknown }) => request<CreatedApplication>('createApplication', data)
export const toggleTaskFn = ({ data }: { data: unknown }) => request<UpdatedTask>('toggleTask', data)
export const updateApplicationFn = ({ data }: { data: unknown }) => request<UpdatedApplication>('updateApplication', data)
