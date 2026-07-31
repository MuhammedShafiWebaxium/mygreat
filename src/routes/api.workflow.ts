import { createFileRoute } from '@tanstack/react-router'
import { GET, POST } from '@/server/api/workflow'
export const Route = createFileRoute('/api/workflow')({ server: { handlers: { GET: () => GET(), POST: ({ request }) => POST(request) } } })
