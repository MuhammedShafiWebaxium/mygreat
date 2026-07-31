import type { ComponentProps } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from '@tanstack/react-router'

type LinkProps = Omit<ComponentProps<typeof RouterLink>, 'to'> & {
  href: string
}

export function Link({ href, ...props }: LinkProps) {
  return <RouterLink to={href} {...props} />
}

export function usePathname() {
  return useLocation({ select: (location) => location.pathname })
}

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (href: string) => navigate({ to: href }),
    replace: (href: string) => navigate({ to: href, replace: true }),
    refresh: () => window.location.reload(),
    back: () => window.history.back(),
  }
}

export function Image({ fill: _fill, priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) {
  return <img {...props} />
}
