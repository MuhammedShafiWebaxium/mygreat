import { createFileRoute } from '@tanstack/react-router'
import { GET, PUT } from '@/server/api/profile'
export const Route = createFileRoute('/api/profile')({ server: { handlers: { GET: () => GET(), PUT: ({ request }) => PUT(request) } } })
