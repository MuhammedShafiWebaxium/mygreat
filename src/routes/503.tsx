import { createFileRoute } from '@tanstack/react-router'
import { ServiceUnavailablePage } from '@/screens/SystemPages'
export const Route = createFileRoute('/503')({ component: ServiceUnavailablePage })
