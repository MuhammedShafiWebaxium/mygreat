import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Home from '@/screens/Home'
import { getSessionUser } from '@/features/auth/session.server'

export const metadata: Metadata = {
  title: 'Plan your study abroad journey',
  description: 'Tell us your goals and build a personalized university shortlist in minutes.',
}

export default async function Page() {
  const user = await getSessionUser()
  if (user) redirect(user.accountType === 'STUDENT' ? '/dashboard' : '/staff')
  return <Home />
}
