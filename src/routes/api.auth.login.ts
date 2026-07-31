import { createFileRoute } from '@tanstack/react-router'
import { POST } from '@/server/api/auth/login'
export const Route = createFileRoute('/api/auth/login')({ server: { handlers: { POST: ({ request }) => POST(request) } } })
