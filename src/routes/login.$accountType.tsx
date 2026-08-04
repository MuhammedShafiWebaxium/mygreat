import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import PartnerLogin from '@/screens/partner/Login'
import StaffLogin from '@/screens/staff/Login'
import StudentLogin from '@/screens/student/Login'
import { getCurrentUserFn } from '@/features/auth/auth.functions'
import type { AccountType } from '@/features/auth/auth.schema'

const accountTypes: Record<string, AccountType> = { student: 'STUDENT', partner: 'PARTNER', admin: 'ADMIN' }

export const Route = createFileRoute('/login/$accountType')({
  head: () => ({ meta: [{ title: 'Sign in | Mygreat' }] }),
  beforeLoad: async ({ params }) => {
    if (!accountTypes[params.accountType]) throw notFound()
    const user = await getCurrentUserFn()
    if (user) throw redirect({ to: user.accountType === 'STUDENT' ? '/dashboard' : '/staff' })
  },
  component: LoginRoute,
})

function LoginRoute() {
  const accountType = accountTypes[Route.useParams().accountType]
  if (accountType === 'ADMIN') return <StaffLogin />
  if (accountType === 'PARTNER') return <PartnerLogin />
  return <StudentLogin />
}
