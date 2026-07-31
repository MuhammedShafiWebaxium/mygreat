import { createFileRoute } from '@tanstack/react-router'
import { POST } from '@/server/api/auth/logout'
export const Route = createFileRoute('/api/auth/logout')({ server: { handlers: { POST: () => POST() } } })
