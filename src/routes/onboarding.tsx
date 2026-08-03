import { createFileRoute, redirect } from '@tanstack/react-router'
import Home from '@/screens/Home'
import { getCurrentUserFn } from '@/features/auth/auth.functions'
import { getOnboardingCatalogFn } from '@/features/onboarding/onboarding.functions'

export const Route = createFileRoute('/onboarding')({
  head: () => ({ meta: [{ title: 'Plan your study abroad journey | Mygreat' }] }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) throw redirect({ to: user.accountType === 'STUDENT' ? '/dashboard' : '/staff' })
  },
  loader: () => getOnboardingCatalogFn(),
  component: OnboardingRoute,
})

function OnboardingRoute() { return <Home catalog={Route.useLoaderData()} /> }
