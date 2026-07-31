import { createFileRoute } from '@tanstack/react-router'
import { PATCH } from '@/server/api/auth/account'
export const Route = createFileRoute('/api/auth/account')({ server: { handlers: { PATCH: ({ request }) => PATCH(request) } } })
