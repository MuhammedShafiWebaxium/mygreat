import { createFileRoute } from '@tanstack/react-router'
import { POST } from '@/server/api/auth/register'
export const Route = createFileRoute('/api/auth/register')({ server: { handlers: { POST: ({ request }) => POST(request) } } })
