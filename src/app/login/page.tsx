import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Login from '@/screens/Login'
import { getSessionUser } from '@/features/auth/session.server'

export const metadata: Metadata = { title: 'Sign in' }

export default async function Page() {
  const user = await getSessionUser()
  if (user) redirect(user.role === 'STUDENT' ? '/dashboard' : '/staff')
  return <Login />
}
