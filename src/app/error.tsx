'use client'

import { UnexpectedErrorPage } from '@/screens/SystemPages'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <UnexpectedErrorPage reset={reset} />
}
