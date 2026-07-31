import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: () => { throw redirect({ to: '/login/$accountType', params: { accountType: 'student' } }) },
})
