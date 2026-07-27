import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Login from '@/screens/Login'
import { getSessionUser } from '@/features/auth/session.server'
import type { AccountType } from '@/features/auth/auth.schema'

export const metadata: Metadata = { title: 'Sign in' }

const accountTypes: Record<string, AccountType> = {
  student: 'STUDENT',
  partner: 'PARTNER',
  admin: 'ADMIN',
}

export default async function Page({ params }: { params: Promise<{ accountType: string }> }) {
  const { accountType: slug } = await params
  const accountType = accountTypes[slug]
  if (!accountType) notFound()
  const user = await getSessionUser()
  if (user) redirect(user.accountType === 'STUDENT' ? '/dashboard' : '/staff')
  return <Login accountType={accountType} />
}
