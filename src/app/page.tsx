import { redirect } from 'next/navigation'
import Landing from '@/screens/Landing'
import { getSessionUser } from '@/features/auth/session.server'

export default async function Page() {
  const user = await getSessionUser()
  if (user) redirect(user.accountType === 'STUDENT' ? '/dashboard' : '/staff')
  return <Landing />
}
