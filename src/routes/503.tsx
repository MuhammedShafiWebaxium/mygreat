import { createFileRoute } from '@tanstack/react-router'
import { ServiceUnavailablePage } from '@/screens/public/SystemPages'
export const Route = createFileRoute('/503')({ component: ServiceUnavailablePage })
