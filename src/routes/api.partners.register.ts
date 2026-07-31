import { createFileRoute } from '@tanstack/react-router'
import { POST } from '@/server/api/partners/register'
export const Route = createFileRoute('/api/partners/register')({ server: { handlers: { POST: ({ request }) => POST(request) } } })
