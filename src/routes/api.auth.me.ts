import { createFileRoute } from '@tanstack/react-router'
import { GET } from '@/server/api/auth/me'
export const Route = createFileRoute('/api/auth/me')({ server: { handlers: { GET: () => GET() } } })
