import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/login') {
      throw redirect({ to: '/login/$accountType', params: { accountType: 'student' } })
    }
  },
})
