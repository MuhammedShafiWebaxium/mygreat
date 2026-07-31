import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { createQueryClient } from './lib/query-client'

export function getRouter() {
  const queryClient = createQueryClient()
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: false,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
