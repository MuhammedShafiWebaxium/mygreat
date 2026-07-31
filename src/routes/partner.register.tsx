import { createFileRoute } from '@tanstack/react-router'
import PartnerRegistration from '@/screens/PartnerRegistration'

export const Route = createFileRoute('/partner/register')({
  head: () => ({ meta: [{ title: 'Register your study abroad company | Mygreat' }] }),
  component: PartnerRegistration,
})
