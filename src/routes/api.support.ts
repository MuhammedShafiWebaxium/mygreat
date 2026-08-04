import { createFileRoute } from '@tanstack/react-router'
import { GET,POST } from '@/server/api/support'
export const Route=createFileRoute('/api/support')({server:{handlers:{GET:({request})=>GET(request),POST:({request})=>POST(request)}}})
