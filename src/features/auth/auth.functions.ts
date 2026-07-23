'use client'

import type { authenticate, registerStudent, updateAccount } from './auth.server'
import type { getSessionUser } from './session.server'

type CurrentUser = Awaited<ReturnType<typeof getSessionUser>>
type RegisteredUser = Awaited<ReturnType<typeof registerStudent>>
type AuthenticatedUser = Awaited<ReturnType<typeof authenticate>>
type UpdatedAccount = Awaited<ReturnType<typeof updateAccount>>

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  } catch (error) {
    throw new Error(
      `Could not reach the authentication API at ${url}.`,
      { cause: error },
    )
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed.')
  return body as T
}

export const registerStudentFn = ({ data }: { data: unknown }) =>
  request<RegisteredUser>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) })

export const loginFn = ({ data }: { data: unknown }) =>
  request<AuthenticatedUser>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })

export const logoutFn = () => request<{ success: true }>('/api/auth/logout', { method: 'POST' })

export const getCurrentUserFn = () => request<CurrentUser>('/api/auth/me')

export const updateMyAccountFn = ({ data }: { data: unknown }) =>
  request<UpdatedAccount>('/api/auth/account', { method: 'PATCH', body: JSON.stringify(data) })
