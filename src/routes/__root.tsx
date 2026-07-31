import { QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { ClientStoreHydrator } from '@/components/ClientStoreHydrator'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Mygreat | Study Abroad' },
      { name: 'description', content: 'Discover universities, build your shortlist, and manage every step of your study abroad journey.' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@300;400;500;600;700;800&display=swap' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootDocument,
  notFoundComponent: () => <div className="grid min-h-screen place-items-center bg-[#060a18] text-white">Page not found.</div>,
})

function RootDocument() {
  const { queryClient } = Route.useRouteContext()
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ClientStoreHydrator><Outlet /></ClientStoreHydrator>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
