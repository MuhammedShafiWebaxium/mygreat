import { createFileRoute } from '@tanstack/react-router'
import { GET, POST } from '@/server/api/admin'
export const Route = createFileRoute('/api/admin')({ server: { handlers: { GET: ({ request }) => GET(request), POST: ({ request }) => POST(request) } } })
