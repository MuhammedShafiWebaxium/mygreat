import type { Metadata } from 'next'
import PartnerRegistration from '@/screens/PartnerRegistration'

export const metadata: Metadata = { title: 'Register your study abroad company' }

export default function Page() {
  return <PartnerRegistration />
}
