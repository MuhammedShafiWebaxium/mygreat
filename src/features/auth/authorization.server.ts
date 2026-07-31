import '@tanstack/react-start/server-only'
import type { UserRole } from './auth.schema'
import { getSessionUser } from './session.server'

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) throw new Error('Authentication required.')
  return user
}

export function assertRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) {
    throw new Error(`This action requires one of these roles: ${allowed.join(', ')}.`)
  }
}
