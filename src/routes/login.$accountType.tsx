import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import Login from '@/screens/Login'
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
  component: () => <Login accountType={accountTypes[Route.useParams().accountType]} />,
})
